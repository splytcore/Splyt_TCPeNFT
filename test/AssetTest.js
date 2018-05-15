var Asset = artifacts.require("./Asset.sol");
var SplytTracker = artifacts.require("./SplytTracker.sol")

contract('AssetTest general test cases.', function(accounts) {

  var assetAddress;
  var splytTrackerInstance;
  var assetInstance;

  beforeEach('Deploying asset contract. ', async function() {

    splytTrackerInstance = await SplytTracker.deployed();
    var result = await splytTrackerInstance.createAsset("0x31f2ae92057a7123ef0e490a", 1, accounts[1], "MyTitle", 1000, 10001556712588, accounts[2], 2);
    assetAddress = await splytTrackerInstance.getAddressById("0x31f2ae92057a7123ef0e490a");
    assetInstance = await Asset.at(assetAddress);
  })

  it('should tell me my contributions && it should be zero.', async function() {
    console.log('asset address from it should', assetAddress);
    var assetInstance = await Asset.at(assetAddress);
    var result = await assetInstance.getMyContributions(accounts[0]);
    assert.equal(result.valueOf(), 0, 'User shouldn\'t have any contributions.');
  })

  it('should be able to contribute partial cost into fractional asset.', async function() {
    var getBal0 = await splytTrackerInstance.getBalance.call(accounts[0]);
    await assetInstance.contribute(accounts[2], accounts[0], 100);
    var getBal = await splytTrackerInstance.getBalance.call(accounts[0]);
    assert.equal(getBal0-getBal, 100, 'Money were not withdrawn from contributor\'s account.');
    var myContributions = await assetInstance.getMyContributions(accounts[0]);
    assert.equal(myContributions, 100, 'User should have contributions.');
  })

  it('buyer is able to contribute full cost into fractional asset.', async function() {
    var assetCost = 1000;
    await assetInstance.contribute(accounts[2], accounts[0], assetCost);
    var myContributions = await assetInstance.getMyContributions(accounts[0]);
    assert.equal(myContributions, assetCost, 'User should have contributions.');
  })

  it('proper amount of money was withdrawn from buyer\'s account after contributing into fractional asset.', async function() {
    var assetCost = 1000;
    var getBal0 = await splytTrackerInstance.getBalance.call(accounts[0]);
    await assetInstance.contribute(accounts[2], accounts[0], assetCost);
    var getBal = await splytTrackerInstance.getBalance.call(accounts[0]);
    assert.equal(getBal0-getBal, assetCost, 'Incorrect amount of money was withdrawn from contributor\'s account.');
  })

  it('proper amount of money was withdrawn from buyer\'s account after contributing into NOT fractional asset.', async function() {
    var assetCost = 1000;
    var splytTrackerInstance = await SplytTracker.deployed();
    var result = await splytTrackerInstance.createAsset("0x31f2ae92057a7123ef0e490a", 0, accounts[1], "MyTitle", assetCost,
    10001556712588, accounts[2], 2);
    assetAddress = await splytTrackerInstance.getAddressById("0x31f2ae92057a7123ef0e490a");

    var getBal0 = await splytTrackerInstance.getBalance.call(accounts[0]);
    var assetInstance = await Asset.at(assetAddress);
    await assetInstance.contribute(accounts[2], accounts[0], assetCost);
    var getBal = await splytTrackerInstance.getBalance.call(accounts[0]);
    assert.equal(getBal0-getBal, assetCost, 'Incorrect amount of money was withdrawn from contributor\'s account.');
  })

  it('seller gets full cost of NOT fractional asset .', async function() {
    var assetCost = 1000;
    var splytTrackerInstance = await SplytTracker.deployed();
    var result = await splytTrackerInstance.createAsset("0x31f2ae92057a7123ef0e490a", 0, accounts[1], "MyTitle", assetCost,
    10001556712588, accounts[2], 2);
    assetAddress = await splytTrackerInstance.getAddressById("0x31f2ae92057a7123ef0e490a");

    var getSellerBal0 = await splytTrackerInstance.getBalance.call(accounts[1]);
    var assetInstance = await Asset.at(assetAddress);
    var result = await assetInstance.contribute(accounts[2], accounts[0], assetCost);
    var getSellerBal1 = await splytTrackerInstance.getBalance.call(accounts[1]);
    assert.equal(getSellerBal1-getSellerBal0, assetCost, 'Incorrect amount of money seller got from contributor.');
  })

  it('user is NOT able to contribute if date is expired.', async function() {
    var splytTrackerInstance = await SplytTracker.deployed();
    var result = await splytTrackerInstance.createAsset("0x31f2ae92057a7123ef0e490a", 1, accounts[1], "MyTitle", 1000,
    1494694079, accounts[2], 2);
    assetAddress = await splytTrackerInstance.getAddressById("0x31f2ae92057a7123ef0e490a");

    var assetInstance = await Asset.at(assetAddress);
    var isOpenForContr = await assetInstance.isOpenForContribution(1);
    assert.equal(isOpenForContr, false, 'I shouldn\'t be able to contribute due to expired date.');
  })

  it('user is NOT able to contribute if total cost has been exceeded.', async function() {
    var isOpenForContr = await assetInstance.isOpenForContribution(1001);
    assert.equal(isOpenForContr, false, 'I shouldn\'t be able to contribute due to exceeded total cost.');
  })

  it('asset is open for contribution.', async function() {
    var isOpenForContr = await assetInstance.isOpenForContribution(999);
    assert.equal(isOpenForContr, true, 'I should be able to contribute.');
  })

  it('user is able to contribute (2 attemps to contribute).', async function() {
    var result = await assetInstance.contribute(accounts[2], accounts[0], 100);
    var isOpenForContr = await assetInstance.isOpenForContribution(899);
    assert.equal(isOpenForContr, true, 'I should be able to contribute.');
  })

  it('user should NOT be able to contribute (2 attemps to contribute) if total cost has been exceeded.', async function() {
    var result = await assetInstance.contribute(accounts[2], accounts[0], 100);
    var isOpenForContr = await assetInstance.isOpenForContribution(999);
    assert.equal(isOpenForContr, false, 'I should be able to contribute.');
  })

  it('user should NOT be able to contribute (2 attemps to contribute) if date is expired.', async function() {
    var time = Date.now()/1000 | 0;
    var splytTrackerInstance = await SplytTracker.deployed();
    var result = await splytTrackerInstance.createAsset("0x31f2ae92057a7123ef0e490a", 1, accounts[1], "MyTitle", 1000,
    time+1, accounts[2], 2);
    assetAddress = await splytTrackerInstance.getAddressById("0x31f2ae92057a7123ef0e490a");

    var assetInstance = await Asset.at(assetAddress);
    var result = await assetInstance.contribute(accounts[2], accounts[0], 100);
    sleep(10*1000);
    var time2 = Date.now()/1000 | 0;
    var isOpenForContr = await assetInstance.isOpenForContribution(899);
    assert.equal(isOpenForContr, false, 'I shouldn\'t be able to contribute if date is expired.');
  })

  it('isFunded returns true if asset has been fully funded.', async function() {
    var assetInstance = await Asset.at(assetAddress);
    var result = await assetInstance.contribute(accounts[2], accounts[0], 1000);
    var isFund = await assetInstance.isFunded();
    assert.equal(isFund, true, 'Asset should be fully funded.');
  })

  it('isFunded returns false if asset has NOT been fully funded.', async function() {
    var assetInstance = await Asset.at(assetAddress);
    var result = await assetInstance.contribute(accounts[2], accounts[0], 999);
    var isFund = await assetInstance.isFunded();
    assert.equal(isFund, false, 'Asset should NOT be fully funded.');
  })

  it('isFractional returns true if asset is fractional.', async function() {
    var assetInstance = await Asset.at(assetAddress);
    var isFund = await assetInstance.isFractional();
    assert.equal(isFund, true, 'Asset should be fractional.');
  })

  it('isFractional returns false if asset is NOT fractional.', async function() {
    var splytTrackerInstance = await SplytTracker.deployed();
    var result = await splytTrackerInstance.createAsset("0x31f2ae92057a7123ef0e490a", 0, accounts[1], "MyTitle", 1000, 10001556712588, accounts[2], 2);
    assetAddress = await splytTrackerInstance.getAddressById("0x31f2ae92057a7123ef0e490a");

    var assetInstance = await Asset.at(assetAddress);
    var isFund = await assetInstance.isFractional();
    console.log('Is funded?: ', isFund);
    assert.equal(isFund, false, 'Asset should NOT be fractional.');
  })

  function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }
})