import { expect } from "chai";
import { ethers } from "hardhat";

import { VotingTokenExample } from "../typechain/VotingTokenExample";
import { GovernorExample, ProposalCreatedEvent } from "../typechain/GovernorExample";
import { Governor, IGovernor } from "../typechain";

enum ProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed
}

enum VoteType {
  Against,
  For,
  Abstain
}


describe("Greeter", function () {
  let VOX:any;
  let token:VotingTokenExample;
  let GOV:any;
  let governance:GovernorExample;

  let owner:any;
  let addr1:any;
  let addr2:any;
  let addr3:any;
  let addrs:any;

  const newProposal =  async (i:number) => {
    //const pid = await governance.hashProposal([addr3.address], [1], [[]], ethers.utils.id("Example proposal "+i))
    const tx = await governance.propose([addr3.address], [ethers.utils.parseEther("1")], [ethers.utils.defaultAbiCoder.encode([], [])], "Example proposal "+i);
    const proposalID = await tx.wait();
    const filter = governance.filters.ProposalCreated(null, null, null, null, null, null, null, null, null);
    const results = proposalID!.events!.find(event => event.event === 'ProposalCreated')
    const [pid] = results!.args!

   
    console.log(pid)
    return pid
  }

  const execute = async (e:any, pid0: any) => {
    const tx = await governance.execute(e.args.targets, e.args[3], e.args.calldatas, ethers.utils.id(e.args.description));
    const receipt = await tx.wait()
    return pid0
  }

  beforeEach(async () => {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    VOX = await ethers.getContractFactory("VotingTokenExample");
    token = await VOX.deploy();

    GOV = await ethers.getContractFactory("GovernorExample")
    governance = await GOV.deploy(token.address);

    await token.deployed();

    await token.mint(addr1.address, 100);
    await token.mint(addr2.address, 200);

    await governance.deployed();

  });
  it("Should create checkpoints", async () => {
    expect(
      await token.getVotes(addr1.address)
    ).to.be.equal(100)

    await expect(
      token.connect(addr1).transfer(addr2.address, 100)
    ).to.be.revertedWith("Transfers not allowed")
  });

  it("Should allow creation and voting on a proposal", async () => {
    const pid0 = await newProposal(0);
    let latestBlock = await ethers.provider.getBlock("latest");

    await ethers.provider.send('evm_setNextBlockTimestamp', [latestBlock.timestamp + 21]);
    await ethers.provider.send('evm_mine', []);

    await governance.connect(addr1).castVote(pid0, VoteType.For);
    await governance.connect(addr2).castVote(pid0, VoteType.Abstain);

    for(let i=0; i<10; i++) {
      await ethers.provider.send('evm_mine', []);
    }

    expect(
      await governance.state(pid0)
    ).to.be.equal(ProposalState.Succeeded)

    const pid1 = await newProposal(1);
    console.log(await governance.state(pid1))

    await expect(
      governance.connect(addr1).castVote(pid1, VoteType.For)
    ).to.be.revertedWith("Governor: vote not currently active")

    latestBlock = await ethers.provider.getBlock("latest");

    console.log(await governance.state(pid1))

    await governance.connect(addr1).castVote(pid1, VoteType.For);
    await governance.connect(addr2).castVote(pid1, VoteType.Against);

    expect(
      await governance.state(pid1)
    ).to.be.equal(ProposalState.Active)

    for(let i=0; i<5; i++) {
      await ethers.provider.send('evm_mine', []);
    }

    expect(
      await governance.state(pid1)
    ).to.be.equal(ProposalState.Defeated)
  })

  it("Should execute on the result", async () => {
    const pid0 = await newProposal(0);

    await owner.sendTransaction({to: governance.address, value: ethers.utils.parseEther("1")})

    await ethers.provider.send('evm_mine', []);

    await governance.connect(addr1).castVote(pid0, VoteType.Against);
    await governance.connect(addr2).castVote(pid0, VoteType.For);


    for(let i=0; i<5; i++) {
      await ethers.provider.send('evm_mine', []);
    }

    const balancePre = await addr3.getBalance();

    const filter = governance.filters.ProposalCreated(null, null, null, null, null, null, null, null, null)
    const events = await governance.queryFilter(filter, 0)
    await Promise.all(events.map(async (e) => {
        if (e.args.proposalId.eq(pid0)) {
          await execute(e, pid0)
        }
      }))

    const balancePost = await addr3.getBalance()

    expect(
      balancePre.add(ethers.utils.parseEther("1"))
    ).to.be.equal(balancePost)
   

  
  })
});
