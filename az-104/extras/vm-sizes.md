# Azure VM Naming Convention

A VM size like D8s_v3 follows the pattern:

`[Family][vCPUs][Features]_[Version]`

- Family letter — the workload type
- Number — vCPU count
- Feature suffix(es) — optional modifiers (like s, m)
- Version — generation (v2, v3, etc.)

`!! Quotas are always on # of vCPUs, not on number of VMs. So a quota of 20 vCPUs allows 10 D2s_v3 or 5 D4s_v3, etc. !!`


Common Suffix Meanings

- s — supports premium SSD storage
- m — memory-intensive (more RAM per vCPU than standard)
- d — has local temp disk
- a — AMD processor-based
- i — isolated (dedicated physical host)


Examples

- A-series (Av2) — Entry-level/general purpose. Good for dev/test, low-traffic web servers, small databases. Cheapest option but least powerful per vCPU.
    - (A4_v2 = 4 vCPUs)
    - (A2m_v2 = 2 vCPUs)
    - (A8_v2 = 8 vCPUs)
- D-series (DSv3) — General purpose, production-grade. Faster processors, better CPU-to-memory ratio than A-series. The "s" means it supports premium SSD storage.
    - (D8s_v3 = 8 vCPUs)
    - (D2s_v3 = 2 vCPUs)
- F-series (Fsv2) — Compute-optimized. Highest CPU performance per vCPU, lower memory ratio. Good for batch processing, gaming servers, analytics.
    - (F2s_v2 = 2 vCPUs)

Some prices for the B v2 series

| VM Size | Type | vCPUs | RAM (GiB) | Data disks | Max IOPS | Local storage (GiB) | Premium disk | Monthly cost |
|---|---|---:|---:|---:|---:|---|---|---:|
| B2ats_v2 | General purpose | 2 | 1 | 4 | 3750 | N/A | Supported | US$7.10 |
| B2ts_v2 | General purpose | 2 | 1 | 4 | 3750 | N/A | Supported | US$7.88 |
| B2als_v2 | General purpose | 2 | 4 | 4 | 3750 | N/A | Supported | US$28.40 |
| B2ls_v2 | General purpose | 2 | 4 | 4 | 3750 | N/A | Supported | US$31.54 |
| B2as_v2 | General purpose | 2 | 8 | 4 | 3750 | N/A | Supported | US$56.79 |
| B2s_v2 | General purpose | 2 | 8 | 4 | 3750 | N/A | Supported | US$63.07 |
| B4als_v2 | General purpose | 4 | 8 | 8 | 6400 | N/A | Supported | US$100.74 |
| B4ls_v2 | General purpose | 4 | 8 | 8 | 6400 | N/A | Supported | US$111.69 |
| B4as_v2 | General purpose | 4 | 16 | 8 | 6400 | N/A | Supported | US$113.88 |

