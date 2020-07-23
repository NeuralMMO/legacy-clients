﻿using System;
using System.Collections;
using System.Diagnostics;
using UnityEngine;
using Debug = UnityEngine.Debug;
using Object = UnityEngine.Object;

namespace Unity.PerformanceTesting.Measurements
{
    public class FramesMeasurement
    {
        private const int k_MinTestTimeMs = 500;
        private const int k_MinWarmupTimeMs = 80;
        private const int k_ProbingMultiplier = 4;
        private const int k_MinIterations = 7;

        private string[] m_ProfilerDefinitions;
        private string m_SampleGroup = "Time";
        private int m_DesiredFrameCount;
        private int m_Executions;
        private int m_Warmup = -1;
        private bool m_RecordFrametime = true;

        public FramesMeasurement ProfilerMarkers(params string[] profilerMarkerNames)
        {
            m_ProfilerDefinitions = profilerMarkerNames;
            return this;
        }

        public FramesMeasurement SampleGroup(string name)
        {
            m_SampleGroup = name;
            return this;
        }

        public FramesMeasurement MeasurementCount(int count)
        {
            m_Executions = count;
            return this;
        }

        public FramesMeasurement WarmupCount(int count)
        {
            m_Warmup = count;
            return this;
        }

        public FramesMeasurement DontRecordFrametime()
        {
            m_RecordFrametime = false;
            return this;
        }

        public ScopedFrameTimeMeasurement Scope(string name = "FrameTime")
        {
            return new ScopedFrameTimeMeasurement(name);
        }

        public IEnumerator Run()
        {
            if (m_Executions == 0 && m_Warmup >= 0)
            {
                Debug.LogError("Provide execution count or remove warmup count from frames measurement.");
                yield break;
            }

            yield return m_Warmup > -1 ? WaitFor(m_Warmup) : GetDesiredIterationCount();
            m_DesiredFrameCount = m_Executions > 0 ? m_Executions : m_DesiredFrameCount;

            using (Measure.ProfilerMarkers(m_ProfilerDefinitions))
            {
                for (var i = 0; i < m_DesiredFrameCount; i++)
                {
                    if (m_RecordFrametime)
                    {
                        using (Measure.Scope(m_SampleGroup))
                        {
                            yield return null;
                        }
                    }
                    else
                    {
                        yield return null;
                    }
                }
            }
        }

        private IEnumerator GetDesiredIterationCount()
        {
            var executionTime = 0.0D;
            var iterations = 1;

            while (executionTime < k_MinWarmupTimeMs)
            {
                var sw = Stopwatch.GetTimestamp();

                yield return WaitFor(iterations);

                executionTime = TimeSpan.FromTicks(Stopwatch.GetTimestamp() - sw).TotalMilliseconds;

                if (iterations == 1 && executionTime > 40)
                {
                    m_DesiredFrameCount = k_MinIterations;
                    yield break;
                }

                if (iterations == 64)
                {
                    m_DesiredFrameCount = 120;
                    yield break;
                }

                if (executionTime < k_MinWarmupTimeMs)
                {
                    iterations *= k_ProbingMultiplier;
                }
            }

            m_DesiredFrameCount = (int)(k_MinTestTimeMs * iterations / executionTime);
        }

        private IEnumerator WaitFor(int iterations)
        {
            for (var i = 0; i < iterations; i++)
            {
                yield return null;
            }
        }

        public struct ScopedFrameTimeMeasurement : IDisposable
        {
            private readonly FrameTimeMeasurement m_Test;

            public ScopedFrameTimeMeasurement(string sampleGroup)
            {
                var go = new GameObject("Recorder");
                if (Application.isPlaying) Object.DontDestroyOnLoad(go);
                m_Test = go.AddComponent<FrameTimeMeasurement>();
                m_Test.SampleGroup = new SampleGroup(sampleGroup);
                PerformanceTest.Disposables.Add(this);
            }

            public void Dispose()
            {
                PerformanceTest.Disposables.Remove(this);
                Object.DestroyImmediate(m_Test.gameObject);
            }
        }
    }
}
