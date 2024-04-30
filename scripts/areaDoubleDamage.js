console.log("************************")
console.log("Setting up double area damage.")
console.log("************************")

const D20Roll = CONFIG.Dice.D20Roll;
const DamageRoll = CONFIG.Dice.DamageRoll;

Hooks.on('midi-qol.preDamageRoll', (workflow) => {
    console.log("************************")
    console.log("Checking double area damage.")
    console.log("************************")
    if ((workflow.templateData?.width || 0) !== 0)  {
        workflow.workflowOptions.damageRollDSN = false;
    }
})

Hooks.on('midi-qol.preDamageRollComplete', async (workflow) => {
    console.log("************************")
    console.log("Checking double area damage pre complete.")
    console.log("************************")

    if ((workflow.templateData?.width || 0) === 0) return true;
    let result = await new D20Roll('1d20').evaluate()
    MidiQOL.displayDSNForRoll(result, 'ddRoll');
    const didDouble = result._total === 20;

    // Update Chat Message
    let chatMessage = MidiQOL.getCachedChatMessage(workflow.itemCardUuid)
    let data = chatMessage?.toObject();
    let cardElement = document.createElement('div');
    cardElement.innerHTML = data.content;
    let newElement = document.createElement('div');
    let ddString = "<b>DD Roll (" + result._total  + "): </b>" + didDouble ? "You dealt double damage!" : "No double damage." + "</div><div class='dnd5e2 evaluation'></div>"
    newElement.classList.add(['card-header', 'title', 'border', 'description']);
    newElement.innerHTML = ddString
    cardElement.querySelector('.midi-results').after(newElement);
    data.content = cardElement.innerHTML
    await ChatMessage.create(data);

    if (!didDouble) return true;
    let newDamageRolls =[]
    for (let rollIndex = 0; rollIndex < workflow.damageRolls.length; rollIndex++) {
        let roll = workflow.damageRolls[rollIndex];
        let updatedRoll = new DamageRoll(roll._formula, roll.data, {...roll.options, configured: false, critical: true, criticalMultiplier: 2, preprocessed: false})
        newDamageRolls.push(await updatedRoll.evaluate());
    }

    await workflow.setDamageRolls(newDamageRolls);
    MidiQOL.displayDSNForRoll(newDamageRolls, 'damageRoll');
})