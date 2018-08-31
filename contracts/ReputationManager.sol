pragma solidity ^0.4.24;

import "./Owned.sol";
import "./Reputation.sol";
import "./ReputationData.sol";
import "./SplytManager.sol";

contract ReputationManager is Owned {
    
    ReputationData public reputationData;
    SplytManager public splytManager;

    //allow owner or splytManager
    modifier onlyOwnerOrSplyt() {
        require(owner == msg.sender || address(splytManager) == msg.sender);
        _;
    }

    constructor(address _splytManager) public {
        reputationData = new ReputationData();
        splytManager = SplytManager(_splytManager);
    }

    //@dev only create new reputation when it creates first review
    function review(address _wallet, uint _rating) public {

         address reputationAddress = reputationData.reputationByWallet(_wallet);

         if (reputationAddress == address(0)) {
            Reputation reputation = new Reputation(_rating, msg.sender);
            reputationData.save(_wallet, address(reputation));
         } else {
            Reputation(reputationAddress).addReview(_rating, msg.sender);
         }

        
    }


    function getDataContractAddress() public view returns (address) {
       return address(reputationData);
    }


    //@dev update data contract address
    function setDataContract(address _reputationData) onlyOwner public {
       reputationData = ReputationData(_reputationData);
    }

    //@dev get asset status

    //@dev get asset status
    function getStatus(address _reputationAddress) public view returns (Reputation.Statuses) {
        return Reputation(_reputationAddress).status();
    }
   

    function setSplytManager(address _address) public onlyOwnerOrSplyt {
        splytManager = SplytManager(_address);
    }


    function getReputationByWallet(address _wallet) public view returns (address) {
      return reputationData.reputationByWallet(_wallet);
    }  

    //@dev checks if address is authorized write to the data contracts
    function isManager(address _address) public view returns (bool) {
        return splytManager.isManager(_address);
    }
   
    //@dev assume 2 decimals
    function getRating(address _address) public view returns (uint) {
        Reputation rep = Reputation(_address);
       return ((rep.totalScore() * 100) / rep.getReviewsLength());

    } 

   //@dev new manager contract that's going to be replacing this
   //Old manager call this function and proposes the new address
    function transferOwnership(address _newAddress) public onlyOwnerOrSplyt {
        reputationData.transferOwnership(_newAddress);
    }

    //@dev if new data contract is deployed, the creator proposes manager adress then the manager needs to accept
    //The new updated manager contract calls this function
    function acceptOwnership() public onlyOwner {
        reputationData.acceptOwnership();
    }

} 