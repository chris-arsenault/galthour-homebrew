console.log("************************")
console.log("Setting up adjusted criticals")
console.log("************************")

const DamageRoll = CONFIG.Dice.DamageRoll;

Hooks.on('midi-qol.preDamageRoll', (workflow) => {
    console.log("************************")
    console.log("Adjusting criticals")
    console.log("************************")
    if (workflow.isCritical) {
        workflow.isCritical = false;
        workflow.workflowOptions.damageRollDSN = false;
        foundry.utils.setProperty(workflow, 'specialCritical', true);
    }
})

Hooks.on('midi-qol.preDamageRollComplete', async (workflow) => {
    if (!workflow.specialCritical) return true;
    //roll the table
    //MidiQOL.displayDSNForRoll(new DamageRoll('1d20'), 'damageRoll');
    const table = await game.tables.getName('Critical Hit');
    let result = await table.draw({roll: true, displayChat: false});
    let resultText = result.results[0].text
    let resultJson = JSON.parse(resultText);

    // Update Chat Message
    let chatMessage = MidiQOL.getCachedChatMessage(workflow.itemCardUuid)
    let data = chatMessage?.toObject();
    let cardElement = document.createElement('div');
    cardElement.innerHTML = data.content;
    let newElement = document.createElement('div');
    let critString = "<b>Crit Roll (" + result.roll._tota + "): </b>" + resultJson.text + "</div><div class='dnd5e2 evaluation' />"
    newElement.classList.add(['card-header', 'title', 'border', 'description']);
    newElement.innerHTML = critString
    cardElement.querySelector('.midi-results').after(newElement);
    data.content = cardElement.innerHTML
    await ChatMessage.create(data);

    // Update rolls to remove double crit and multiply flat damage.
    let multi = resultJson.multiplier;
    let addedDamage = result.addedDamage || 0;
    let addedDamagePerType = (addedDamage/workflow.damageRolls.length).toString();

    let newDamageRolls =[]
    for (let rollIndex = 0; rollIndex < workflow.damageRolls.length; rollIndex++) {
        let roll = workflow.damageRolls[rollIndex];
        let terms = roll._formula.split(" ");
        for (let termIndex = 0; termIndex < terms.length; termIndex++) {
            if (terms[termIndex].indexOf("d") !== -1) {
                let s = terms[termIndex].split("d")
                let numDice = s[0]/2 //5e System auto multiplies by 2.
                terms[termIndex] = numDice + "d" + s[1]
            } else if (!isNaN(terms[termIndex])) {
                terms[termIndex] = terms[termIndex] * multi
            }
        }
        let formula = terms.join(" ");
        let updatedRoll = new DamageRoll(formula, roll.data, {...roll.options, configured: false, critical: true, criticalMultiplier: multi, criticalBonusDamage: addedDamagePerType, preprocessed: false})
        newDamageRolls.push(await updatedRoll.evaluate());
    }

    await workflow.setDamageRolls(newDamageRolls);
    MidiQOL.displayDSNForRoll(newDamageRolls, 'damageRoll');
})