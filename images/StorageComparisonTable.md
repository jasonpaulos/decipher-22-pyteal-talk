### Boxes vs. Other Storage Mechanisms

<div style="width:800px">   

|  <div style="width:200px">Property</div> | <div style="width:150px">Global Storage</div> | <div style="width:150px">Local Storage</div> | <div style="width:200px">Box Storage</div> |
|:--- |:--- |:--- |:--- |
| Max(key+value) | 128 bytes | 128 bytes | 32,832 bytes |
| Max storage | 64 pairs or 8 KB | 16 pairs or 2 KB | $\infty$ |
| On-Chain Visibility | Public | Public | Private: boxes only visible to their app |
| Best Case MBR<sup>*</sup> | 0.4125 Algo/KB | 0.45 Algo/KB | 0.4097 Algo/KB |
| Account for MBR | Creator Account | Opt-In Account | App Account |
| MBR funds after app deletion | Recovered | CloseOut to recover | Unrecoverable<sup>**</sup>  |
| External Ref in Txn | Appid for external lookup | Appid + creator acct for external lookup | Box reference required |

</div>

* <sup>*</sup>**MBR**: _Minimum Balance Requirement_
    * The following _best case calculations_ are based on the [app MBR formula](https://developer.algorand.org/docs/get-details/dapps/smart-contracts/apps/#minimum-balance-requirement-for-a-smart-contract) and the [box MBR formula](https://developer.algorand.org/articles/smart-contract-storage-boxes/#box-mbr-details-example):
        * Global storage:
            1. Assuming an _unlimited storage requirement_ and therefore cooperating apps. The cost of maintaining each app needs to be accounted for. App MBR + 64 byte slice key/value pairs: (0.1 Algo + 64 * 0.05 Algo) / 8 KB = 0.4125 Algo/KB
            2. Assuming a single app, it is slightly cheaper to utilize all global state storage before moving on to boxes. The _marginal_ cost of each global byte slice is 0.4 Algo/KB.
        * Local storage. OptIn + 16 byte slice key/value pairs: (0.1 Algo + 16 * 0.05 Algo) / 2 KB  = 0.45 Algo/KB
        * Box Storage - optimized by maximizing box size with key of length 64 bytes and value of length 32KB. Cost per such box is (2,500 + 400 * 32,832) microAlgo / 32,832 bytes ≈ 0.4096788 Algo/KB
* <sup>**</sup>Best practice requires making app deletion contingent on prior box cleanup