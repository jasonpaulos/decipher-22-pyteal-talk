### Boxes vs. Other Storage Mechanisms

<div style="width:800px">
    
|  <div style="width:200px">Property</div> | <div style="width:150px">Global Storage</div> | <div style="width:150px">Local Storage</div> | <div style="width:200px">Box Storage</div> |
|:--- |:--- |:--- |:--- |
| **Max**(key+value) | 128 bytes | 128 bytes | 32,832 bytes |
| Max storage | 64 pairs or 8 KB | 16 pairs or 2 KB | $\infty$ |
| On-Chain Visibility | Public | Public | Private: boxes only visible to their app |
| Best Case MBR<sup>*</sup> | 0.40 Algo/KB | 0.40 Algo/KB | 0.41 Algo/KB |
| Account for MBR | Creator Account | Opt-In Account | App Account |
| MBR funds after app deletion | Recovered | CloseOut to recover | Unrecoverable <sup>**</sup>  |
| External Ref in Txn | Appid for external lookup | Appid + creator acct for external lookup | Box reference required |

</div>

* <sup>*</sup>**MBR**: Minimum Balance Requirement
    * Best case calculations:
        * Global/Local Storage - [formula](https://developer.algorand.org/docs/get-details/dapps/smart-contracts/apps/#minimum-balance-requirement-for-a-smart-contract) for byte slice is slightly cheaper. Cost per key/value pair is 50,000 microAlgo / 128 bytes = 0.40 Algo / KB
        * Box Storage - [formula](https://developer.algorand.org/articles/smart-contract-storage-boxes/#box-mbr-details-example) optimized by maximizing box size with key of length 64 and value of length 32KB. Cost per such box is (2,500 + 400 * 32,832) microAlgo / 32,832 bytes ≈ 0.4096788 Algo / KB
* <sup>**</sup>Best practice requires making app deletion contingent on prior box cleanup