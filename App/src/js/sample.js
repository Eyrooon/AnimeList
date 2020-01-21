/* eslint-disable no-use-before-define */
import _ from 'lodash';

export const parseProjectJSON = function (targets) {
    return targets.filter(target => (target.blocks))
        .reduce((challengeAnswerMap, target) => {
            target.blockMap = new Map();
            challengeAnswerMap.set(target.name, target);
            if (target.blocks) {
                const roots = new Map();
                _(target.blocks).forEach((block, id) => {
                    target.blockMap.set(id, block);
                    if (block.parent === null) {
                        let eventkey = block.opcode;
                        _(block.fields).forEach((value, key) => {
                            eventkey += key + value;
                            eventkey = eventkey.split(' ').join('');
                        }
                        );
                        roots.set(eventkey, block);
                        // console.log(roots);
                    }
                });
                target.blockMap.set('roots', roots);
            }
            return challengeAnswerMap;
        }, new Map());
};

export const checIfBlocksEmpty = function (jsonObject) {
    return jsonObject.targets.filter(target => JSON.stringify(target.blocks) !== '{}');
};

export const removeJsonBlocks = function (jsonObject) {
    jsonObject.targets.forEach(target => (target.blocks = {}));
    return JSON.stringify(jsonObject);
};

export const removeJsonSelectedSprites = function (jsonObject, selectedSprites) {
    const selectedSpriteObj = {};
    selectedSprites.forEach(sprite => {
        selectedSpriteObj[sprite] = sprite;
    });
    jsonObject.targets.forEach(target => {
        if (selectedSpriteObj[target.name]) {
            target.blocks = {};
        }
    });
    return JSON.stringify(jsonObject);
};

export const transferJsonBlocks = function (origJsonObject, answerJsonObject) {
    const targetBlocksMap = answerJsonObject.targets.reduce((innerTargetBlocksMap, target) => {
        innerTargetBlocksMap.set(target.name, target.blocks);
        return innerTargetBlocksMap;
    }, new Map());

    origJsonObject.targets.forEach(target => {
        target.blocks = targetBlocksMap.get(target.name);
    });

    return JSON.stringify(origJsonObject);
};

const compareInputField = function (solutionTarget, answerTarget, currentSolutionInputField,
    currentAnswerInputField) {
    if (currentSolutionInputField && currentAnswerInputField &&
        _(currentSolutionInputField).size() === _(currentAnswerInputField).size()) {

        if (_(currentSolutionInputField).size() > 0) {
            const arrayKeys = Object.keys(currentSolutionInputField);
            // console.log(arrayKeys);
            for (let i = 0; i < arrayKeys.length; i++) {
                const key = arrayKeys[i];
                const currentAnswerTargetInputField = currentAnswerInputField[key];
                if (currentSolutionInputField[key]) {
                    if (_.isArray(currentSolutionInputField[key])) {
                        const currentSolutionArray = currentSolutionInputField[key];
                        const currentAnswerArray = currentAnswerTargetInputField;
                        if (!compareArray(solutionTarget, answerTarget, currentSolutionArray, currentAnswerArray)) {
                            // console.log(' compareInputField compareArray false ');
                            return false;
                        }
                    } else {
                        // console.log(' isArray currentSolutionInputField false ');
                        return false;
                    }
                } else {
                    // console.log(' null currentSolutionInputField false ');
                    return false;
                }
            }
        }

    } else {
        // console.log(currentSolutionInputField + ' ' + currentAnswerInputField);
        return false;
    }
    return true;
};

const compareAnswer = function (solutionTarget, answerTarget, currentSolutionTarget, currentAnswerTarget) {
    if (!currentSolutionTarget && currentSolutionTarget === currentAnswerTarget) {
        return true;
    } else if (currentSolutionTarget && currentAnswerTarget &&
        currentSolutionTarget.opcode === currentAnswerTarget.opcode &&
        compareInputField(solutionTarget, answerTarget,
            currentSolutionTarget.inputs, currentAnswerTarget.inputs, currentSolutionTarget.opcode) &&
        compareInputField(solutionTarget, answerTarget,
            currentSolutionTarget.fields, currentAnswerTarget.fields, currentSolutionTarget.opcode, 'fields')) {

        if (_(currentSolutionTarget.next).size() > 0 && _(currentAnswerTarget.next).size() > 0) {
            // console.log(`${currentSolutionTarget.next} ${currentAnswerTarget.next}`);
            currentSolutionTarget = solutionTarget.blockMap.get(currentSolutionTarget.next);
            currentAnswerTarget = answerTarget.block    Map.get(currentAnswerTarget.next);
            if (currentSolutionTarget && currentAnswerTarget) {
                // console.log(`${currentSolutionTarget} ${currentAnswerTarget}`);
                return compareAnswer(solutionTarget, answerTarget, currentSolutionTarget, currentAnswerTarget);
            }
        } else if (currentSolutionTarget.next === currentAnswerTarget.next) { // null
            return true;
        } else {
            return false;
        }

        return true;
    }
    // console.log(`compareAnswer  false ${currentSolutionTarget} ${currentAnswerTarget} `);
    return false;
};

const compareArray = function (solutionTarget, answerTarget, currentSolutionArray, currentAnswerArray) {
    if (_(currentSolutionArray).size() === _(currentAnswerArray).size()) {
        for (let i = 0; i < _(currentSolutionArray).size(); i++) {
            if (_.isNumber(currentSolutionArray[i])) {
                if (currentSolutionArray[i] !== currentAnswerArray[i]) {
                    // console.log(`isNumber false ${currentSolutionArray[i]} ${currentAnswerArray[i]}`);
                    return false;
                }
            } else if (_.isArray(currentSolutionArray[i])) {
                const innerCurrentSolutionArray = currentSolutionArray[i];
                const innerCurrentAnswerArray = currentAnswerArray[i];
                if (!compareArray(solutionTarget, answerTarget, innerCurrentSolutionArray, innerCurrentAnswerArray)) {
                    return false;
                }
            } else if (_.isString(currentSolutionArray[i]) &&
                        currentSolutionArray[i].length === currentAnswerArray[i].length) {
                if (currentSolutionArray[i].length >= 20) {
                    // console.log(currentSolutionArray[i] + ' ' + currentAnswerArray[i]);
                    const currentSolutionTarget = solutionTarget.blockMap.get(currentSolutionArray[i]);
                    const currentAnswerTarget = answerTarget.blockMap.get(currentAnswerArray[i]);
                    if (!compareAnswer(solutionTarget, answerTarget, currentSolutionTarget, currentAnswerTarget)) {
                        return false;
                    }
                } else if (currentSolutionArray[i] !== currentAnswerArray[i]) {
                    // eslint-disable-next-line max-len
                    // console.log(`compareArray String normal false ${currentSolutionArray[i]} ${currentAnswerArray[i]}`);
                    return false;
                }
            } else if (currentSolutionArray[i] !== currentAnswerArray[i]) {
                // console.log(`compareArray Object normal false ${currentSolutionArray[i]} ${currentAnswerArray[i]}`);
                return false;
            }
        }
    } else {
        // console.log(`compareArray false ${currentSolutionArray} ${currentAnswerArray}`);
        return false;
    }
    return true;
};

export const validateAnswer = function (solution, answer) {
    let validationAnswer = true;
    solution.forEach((value, key) => {
        if (validationAnswer) {
            const solutionTarget = value;
            const answerTarget = answer.get(key);
            const roots = solutionTarget.blockMap.get('roots');
            roots.forEach((value2, key2) => {
                if (validationAnswer) {
                    const currentSolutionTarget = value2;
                    // console.log(currentSolutionTarget);
                    const currentAnswerTarget = answerTarget.blockMap.get('roots').get(key2);
                    validationAnswer = compareAnswer(solutionTarget, answerTarget,
                        currentSolutionTarget, currentAnswerTarget);
                }
            });
        }
    });
    return validationAnswer;
};
