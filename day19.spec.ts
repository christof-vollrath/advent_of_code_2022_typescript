// Advent of code 2022 - day 19

import {readFileSync} from "fs"
import {Dictionary} from "typescript-collections";
import {calculateSum} from "./day02.spec";

export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

class PartsList {
    partsList: Dictionary<string, number> = new Dictionary<string, number>()
}

class Blueprint {
    constructor(id: number) {
        this.id = id;
    }
    id: number
    partsLists: Dictionary<string, PartsList> = new Dictionary<string, PartsList>()
}

function parseBlueprint(line: string): Blueprint {
    const blueprintRegex = /Blueprint (\d+): Each ore robot costs (\d+) ore. Each clay robot costs (\d+) ore. Each obsidian robot costs (\d+) ore and (\d+) clay. Each geode robot costs (\d+) ore and (\d+) obsidian\./
    const regexResult = blueprintRegex.exec(line)
    if (!regexResult || regexResult.length < 7) throw Error(`can't parse ${line} ${regexResult?.length}`)
    const result = new Blueprint(Number.parseInt(regexResult[1]))
    const oreRobotParts = new PartsList()
    oreRobotParts.partsList.setValue("ore", Number.parseInt(regexResult[2]))
    result.partsLists.setValue("ore", oreRobotParts)
    const clayRobotParts = new PartsList()
    clayRobotParts.partsList.setValue("ore", Number.parseInt(regexResult[3]))
    result.partsLists.setValue("clay", clayRobotParts)
    const obsidianRobotParts = new PartsList()
    obsidianRobotParts.partsList.setValue("ore", Number.parseInt(regexResult[4]))
    obsidianRobotParts.partsList.setValue("clay", Number.parseInt(regexResult[5]))
    result.partsLists.setValue("obsidian", obsidianRobotParts)
    const geodeRobotParts = new PartsList()
    geodeRobotParts.partsList.setValue("ore", Number.parseInt(regexResult[6]))
    geodeRobotParts.partsList.setValue("obsidian", Number.parseInt(regexResult[7]))
    result.partsLists.setValue("geode", geodeRobotParts)
    return result
}

function parseBlueprints(lines: string[]) {
    return lines.map(line => parseBlueprint(line))
}

enum Action {
    doNothing = "nothing",
    buildOreRobot = "ore",
    buildClayRobot = "clay",
    buildObsidianRobot = "obsidian",
    buildGeodeRobot = "geode"
}

type RobotState = {
    nrRobots: { [id: string]: number }
    nrResources: { [id: string]: number }
}

function executeAction(blueprint: Blueprint, state: RobotState, action: Action) {
    // produce material for each robot
    for (const robot of Object.keys(state.nrRobots)) {
        const nrRobot = state.nrRobots[robot]
        if (nrRobot) {
            let nrResources = state.nrResources[robot]
            if (nrResources === undefined) nrResources = nrRobot
            else nrResources += nrRobot
            state.nrResources[robot] = nrResources
        }
    }
    // create new robot
    if (action !== Action.doNothing) {
        // consume resources for building the robot
        const partsNeeded = blueprint.partsLists.getValue(action)
        if (partsNeeded === undefined)  throw new Error(`no parts list to build ${action}`)
        for (const part of partsNeeded.partsList.keys()) {
            let nrNeeded = partsNeeded.partsList.getValue(part)!
            let nrResources = state.nrResources[part]
            if (nrResources === undefined) throw new Error(`no parts to build ${action}`)
            nrResources -= nrNeeded
            state.nrResources[part] = nrResources
        }
        // build robot
        let nrRobot = state.nrRobots[action]
        if (nrRobot === undefined) nrRobot = 1
        else nrRobot++
        state.nrRobots[action] = nrRobot
    }
}

function executeActions(blueprint: Blueprint, actions: Action[]): RobotState {
    const state: RobotState = { nrRobots: {}, nrResources: {}}
    state.nrRobots["ore"] = 1 // start with one ore robot
    for (const action of actions) {
        executeAction(blueprint, state, action);
    }
    return state
}

function enoughResources(blueprint: Blueprint, state: RobotState, action: string) {
    const resourcesNeeded = blueprint.partsLists.getValue(action)?.partsList
    if (!resourcesNeeded) throw new Error(`no blueprint for action=${action}`)
    for (const resourceName of resourcesNeeded.keys()) {
        const resourceNeeded = resourcesNeeded.getValue(resourceName)!
        if (state.nrResources[resourceName] === undefined || state.nrResources[resourceName] < resourceNeeded) return false
    }
    return true
}

function findPossibleActions(blueprint: Blueprint, maxMinutes: number, minute: number, state: RobotState) {
    function guessActions(): Action[] {
        if (minute < 18) return Object.values(Action)
        else {
            // Optimization, don't build robots which are no more useful
            const result: Action[] = [Action.doNothing]
            if (minute <= 19) result.push(Action.buildClayRobot)
            if (minute <= 21) result.push(Action.buildObsidianRobot)
            if (minute <= 23) result.push(Action.buildGeodeRobot)
            return result
        }
    }
    let result: Action[] = []
    for (const action of guessActions()) {
        if (action === Action.doNothing || enoughResources(blueprint, state, action)) result.push(action)
    }
    return result
}

type ActionsAndState = { finalState: RobotState, actions: Action[] }

function filterBadRobots(nrMinutes: number, blueprint: Blueprint, resourceName: string, minute: number, actionsAndStates: ActionsAndState[]) {
    const bestGeodeNr = Math.max(...actionsAndStates.map(actionsAndState => actionsAndState.finalState.nrResources["geode"] ?? 0))
    console.log("bestGeodeNr so far: " + bestGeodeNr)
    // when robots can for sure not become any better than what we already have they can be ignored
    const filtered = actionsAndStates.filter(actionsAndState => {
        if (resourceName === "ore") return true // no upper bound for ore
        const upperLimit = estimateUpperBoundState(actionsAndState.finalState, blueprint, nrMinutes, minute).nrResources[resourceName] ?? 0
        //console.log(`upperLimit: ${upperLimit} bestGeodeNr: ${bestGeodeNr}`)
        return upperLimit > bestGeodeNr
    })
    console.log(`filtering bad paths before: ${actionsAndStates.length} after: ${filtered.length}`)
    return filtered
}

function filterMaxRobots(maxRobots: { [p: string]: number }, actionsAndStates: ActionsAndState[]) {
    function nrRobotsTooBig(maxRobots: { [p: string]: number }, actionsAndState: ActionsAndState) {
        const currentNrRobots = actionsAndState.finalState.nrRobots
        for (const robotName of Object.values(Action)) {
            const maxRobotNr = maxRobots[robotName]
            if (maxRobotNr === undefined) continue
            const robotNr = currentNrRobots[robotName]
            if (robotNr === undefined) continue
            if (robotNr > maxRobotNr) return true // we don't need to have more robots than needed
        }
        return false;
    }
    const filtered = actionsAndStates.filter(actionsAndState => !nrRobotsTooBig(maxRobots, actionsAndState))
    console.log(`filtering paths max before: ${actionsAndStates.length} after: ${filtered.length}`)
    if (actionsAndStates.length === 2482)
        console.log("20")
    return filtered
}

function findBestPlan(blueprint: Blueprint, nrMinutes: number, resourceName: string) {
    function findBestActions(actionsAndStates: ActionsAndState[], resourceName: string) {
        let best = actionsAndStates[0]
        for (let i = 1; i < actionsAndStates.length; i++) {
            const bestResourceNr = best.finalState.nrResources[resourceName] ?? 0
            const currResourceNr = actionsAndStates[i].finalState.nrResources[resourceName] ?? 0
            if (currResourceNr > bestResourceNr)
                best = actionsAndStates[i]
        }
        return best
    }
    const maxRobots = findMaxRobots(blueprint)
    let actionsAndStates: ActionsAndState[] = []
    const initialState = executeActions(blueprint, [])
    actionsAndStates.push({ finalState: initialState, actions: []})
    for (let minute = 1; minute <= nrMinutes; minute++) {
        let nextActionsAndStates = []
        console.log(`findBestPlan minute=${minute} paths=${actionsAndStates.length}`)
        for (const actionsAndState of actionsAndStates) {
            const possibleActions = findPossibleActions(blueprint, nrMinutes, minute, actionsAndState.finalState)
            for (const nextAction of possibleActions) {
                const nextState = JSON.parse(JSON.stringify(actionsAndState.finalState))
                executeAction(blueprint, nextState, nextAction)
                const nextActions = [...actionsAndState.actions]
                nextActions.push(nextAction)
                const nextActionsAndState = { actions: nextActions, finalState: nextState }
                nextActionsAndStates.push(nextActionsAndState)
            }
        }
        actionsAndStates = compressActionsAndStates(filterMaxRobots(maxRobots, filterBadRobots(nrMinutes, blueprint, resourceName, minute, nextActionsAndStates)))
        if (actionsAndStates.length <= 10) {
            // debug console
            console.log(`minute: ${minute}`)
            console.log(actionsAndStates.map(actionsAndState => actionsAndState.actions.join(" ")).join("\n"))
        }
    }
    return findBestActions(actionsAndStates, resourceName)
}

function isBetter(state1: RobotState, state2: RobotState) {
    let state1Better = false
    let state2Better = false
    for (const robotName of Object.values(Action)) {
        if (state1.nrRobots[robotName] === undefined && state2.nrRobots[robotName] !== undefined)
            state2Better = true
        else if (state1.nrRobots[robotName] !== undefined && state2.nrRobots[robotName] === undefined)
            state1Better = true
        else if (state1.nrRobots[robotName] !== undefined && state2.nrRobots[robotName] !== undefined) {
            if (state1.nrRobots[robotName] < state2.nrRobots[robotName])
                state2Better = true
            if (state1.nrRobots[robotName] > state2.nrRobots[robotName])
                state1Better = true
        }
    }
    if (state1Better && state2Better) return false // mixed
    for (const resourceName of Object.values(Action)) {
        if (state1.nrResources[resourceName] === undefined && state2.nrResources[resourceName] !== undefined)
            state2Better = true
        else if (state1.nrResources[resourceName] !== undefined && state2.nrResources[resourceName] === undefined)
            state1Better = true
        else if (state1.nrResources[resourceName] !== undefined && state2.nrResources[resourceName] !== undefined) {
            if (state1.nrResources[resourceName] < state2.nrResources[resourceName])
                state2Better = true
            if (state1.nrResources[resourceName] > state2.nrResources[resourceName])
                state1Better = true
        }
    }
    return state1Better && ! state2Better
}

function isEqual(state1: RobotState, state2: RobotState) {

    for (const robotName of Object.values(Action)) {
        if (state1.nrRobots[robotName] === undefined && state2.nrRobots[robotName] !== undefined)
            return false
        else if (state1.nrRobots[robotName] !== undefined && state2.nrRobots[robotName] === undefined)
            return false
        else if (state1.nrRobots[robotName] !== undefined && state2.nrRobots[robotName] !== undefined) {
            if (state1.nrRobots[robotName] !== state2.nrRobots[robotName])
                return false
        }
    }
    for (const resourceName of Object.values(Action)) {
        if (state1.nrResources[resourceName] === undefined && state2.nrResources[resourceName] !== undefined)
            return false
        else if (state1.nrResources[resourceName] !== undefined && state2.nrResources[resourceName] === undefined)
            return false
        else if (state1.nrResources[resourceName] !== undefined && state2.nrResources[resourceName] !== undefined) {
            if (state1.nrResources[resourceName] !== state2.nrResources[resourceName])
                return false
        }
    }
    return true
}

function compressActionsAndStates(actionsAndStates: ActionsAndState[]) {
    const result: ActionsAndState[] = []
    for (let i1 = 0; i1 < actionsAndStates.length; i1++) {
        const currentActionsAndState = actionsAndStates[i1]
        let betterFound = false
        for (let i2 = 0; i2 < actionsAndStates.length; i2++) {
            if (i2 !== i1) {
                if (isBetter(actionsAndStates[i2].finalState, currentActionsAndState.finalState))
                    betterFound = true
            }
        }
        if (! betterFound) {
            // add to results unless results already contains an equal good state
            // (a better one can not be found, because than this one would not be selected before
            let equalFound = false
            for (const actionsAndState of result) {
                if (isEqual(actionsAndState.finalState, currentActionsAndState.finalState)) {
                    equalFound = true; break
                }
            }
            if (!equalFound) result.push(currentActionsAndState)
        }
    }
    return result
}

function estimateUpperBoundState(state: RobotState, blueprint: Blueprint, maxMinutes: number, minute: number) {
    const currState = JSON.parse(JSON.stringify(state))
    for (let i = minute; i <= maxMinutes; i++) {
        // Check if something can be produced only based on the main ingredient because main ingredient are unique per robot
        for (const robotName of Object.values(Action)) {
            if (robotName !== Action.doNothing && robotName !== Action.buildOreRobot) { // actions are also the names of the robots, ignore ore
                const nrClayNeededForObsidianRobot = blueprint.partsLists.getValue("obsidian")?.partsList.getValue("clay")
                const nrObsidianNeededForGeodeRobot = blueprint.partsLists.getValue("geode")?.partsList.getValue("obsidian")
                currState.nrRobots["clay"] = (currState.nrRobots["clay"] ?? 0) + 1 // assume can always build clay robots because ore is ignored
                if (nrClayNeededForObsidianRobot && currState.nrResources["clay"] && currState.nrResources["clay"] >= nrClayNeededForObsidianRobot) {
                    currState.nrRobots["obsidian"] = (currState.nrRobots["obsidian"] ?? 0) + 1
                    currState.nrResources["clay"] = currState.nrResources["clay"] - nrClayNeededForObsidianRobot
                }
                if (nrObsidianNeededForGeodeRobot && currState.nrResources["obsidian"] && currState.nrResources["obsidian"] >= nrObsidianNeededForGeodeRobot) {
                    currState.nrRobots["geode"] = (currState.nrRobots["geode"] ?? 0) + 1
                    currState.nrResources["obsidian"] = currState.nrResources["obsidian"] - nrObsidianNeededForGeodeRobot
                }
            }
        }
        // create resources
        //console.log("after creating robots: " + JSON.stringify(currState))
        for (const robotName of Object.values(Action)) {
            if (robotName !== Action.doNothing && robotName !== Action.buildOreRobot) { // actions are also the names of the robots
                const nrRobots = currState.nrRobots[robotName]
                const nrResources = currState.nrResources[robotName]
                if (nrRobots) {
                    currState.nrResources[robotName] = (nrResources ?? 0) + nrRobots // every robot produces resources
                }
            }
        }
        //console.log("after creating resources: " + JSON.stringify(currState))
    }
    return currState
}

/*
There is a maximal number of robots to produce for each blueprint.
Since in every minute all robots produce, and in one minute only one robot can be created,
it makes no sense to produce more resources than can be used to produce a new robot.
For each resource the maximum production number is the maximum of needs for this resource in the blueprint.
 */
function findMaxRobots(blueprint: Blueprint) {
    const result: { [id: string]: number } = {}
    for (const robotName of Object.values(Action)) {
        if (robotName !== "nothing"  && robotName !== "geode") {
            const maxResourceNrs = blueprint.partsLists.values().map(partsList => partsList.partsList.getValue(robotName) ?? 0)
            result[robotName] = Math.max(...maxResourceNrs)
        }
    }
    return result
}

function findQuality(blueprintId: number, blueprint: Blueprint, maxMinutes: number, resourceName: string) {
    const actionsAndState = findBestPlan(blueprint, maxMinutes, resourceName)
    const nrResources = actionsAndState?.finalState?.nrResources[resourceName] ?? 0
    const result = nrResources * blueprintId
    console.log(`----blueprintId=${blueprintId} nrResources=${nrResources} result=${result}`)
    return result
}

describe("Day 19", () => {

    const allActions = [
        Action.doNothing, // Minute 1
        Action.doNothing, // Minute 2
        Action.buildClayRobot, // Minute 3
        Action.doNothing, // Minute 4
        Action.buildClayRobot, // Minute 5
        Action.doNothing, // Minute 6
        Action.buildClayRobot, // Minute 7
        Action.doNothing, // Minute 8
        Action.doNothing, // Minute 9
        Action.doNothing, // Minute 10
        Action.buildObsidianRobot, // Minute 11
        Action.buildClayRobot, // Minute 12
        Action.doNothing, // Minute 13
        Action.doNothing, // Minute 14
        Action.buildObsidianRobot, // Minute 15
        Action.doNothing, // Minute 16
        Action.doNothing, // Minute 17
        Action.buildGeodeRobot, // Minute 18
        Action.doNothing, // Minute 19
        Action.doNothing, // Minute 20
        Action.buildGeodeRobot, // Minute 21
        Action.doNothing, // Minute 22
        Action.doNothing, // Minute 23
        Action.doNothing // Minute 24
    ]
    const example = `
Blueprint 1: Each ore robot costs 4 ore. Each clay robot costs 2 ore. Each obsidian robot costs 3 ore and 14 clay. Each geode robot costs 2 ore and 7 obsidian.
Blueprint 2: Each ore robot costs 2 ore. Each clay robot costs 3 ore. Each obsidian robot costs 3 ore and 8 clay. Each geode robot costs 3 ore and 12 obsidian.
        `
    describe("Example", () => {
        const lines = parseLines(example)
        it("should have parsed 2 lines", () => {
            expect(lines.length).toBe(2)
        })
        const blueprints = parseBlueprints(lines)
        it("should have parsed blueprints", () => {
            expect(blueprints.length).toBe(2)
            expect(blueprints[1].id).toBe(2)
            expect(blueprints[1].partsLists.getValue("obsidian")?.partsList.getValue("ore")).toBe(3)
            expect(blueprints[1].partsLists.getValue("geode")?.partsList.getValue("obsidian")).toBe(12)
        })
        describe("execute actions", () => {
            const state = executeActions(blueprints[0], [])
            it("should have constructed robots", () => {
                expect(state).toStrictEqual( { nrRobots: { ore: 1}, nrResources: {} })
            })
            it("should execute actions", () => {
                executeAction(blueprints[0], state, Action.doNothing) // minute 1
                expect(state).toStrictEqual( { nrRobots: { ore: 1}, nrResources: { ore: 1 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 2
                expect(state).toStrictEqual( { nrRobots: { ore: 1}, nrResources: { ore: 2 } })
                executeAction(blueprints[0], state, Action.buildClayRobot) // minute 3
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 1}, nrResources: { ore: 1 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 4
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 1}, nrResources: { ore: 2, clay: 1 } })
                executeAction(blueprints[0], state, Action.buildClayRobot) // minute 5
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 2}, nrResources: { ore: 1, clay: 2 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 6
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 2}, nrResources: { ore: 2, clay: 4 } })
                executeAction(blueprints[0], state, Action.buildClayRobot) // minute 7
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3}, nrResources: { ore: 1, clay: 6 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 8
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3}, nrResources: { ore: 2, clay: 9 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 9
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3}, nrResources: { ore: 3, clay: 12 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 10
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3}, nrResources: { ore: 4, clay: 15 } })
                executeAction(blueprints[0], state, Action.buildObsidianRobot) // minute 11
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 3, obsidian: 1}, nrResources: { ore: 2, clay: 4 } })
                executeAction(blueprints[0], state, Action.buildClayRobot) // minute 12
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 1}, nrResources: { ore: 1, clay: 7, obsidian: 1 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 13
                executeAction(blueprints[0], state, Action.doNothing) // minute 14
                executeAction(blueprints[0], state, Action.buildObsidianRobot) // minute 15
                executeAction(blueprints[0], state, Action.doNothing) // minute 16
                executeAction(blueprints[0], state, Action.doNothing) // minute 17
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 2}, nrResources: { ore: 3, clay: 13, obsidian: 8 } })
                executeAction(blueprints[0], state, Action.buildGeodeRobot) // minute 18
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 2, geode: 1}, nrResources: { ore: 2, clay: 17, obsidian: 3 } })
                executeAction(blueprints[0], state, Action.doNothing) // minute 19
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 2, geode: 1}, nrResources: { ore: 3, clay: 21, obsidian: 5, geode: 1 } })
            })
            it("should execute all actions for the first blueprint", () => {
                const state = executeActions(blueprints[0], allActions)
                expect(state).toStrictEqual( { nrRobots: { ore: 1, clay: 4, obsidian: 2, geode: 2}, nrResources: { ore: 6, clay: 41, obsidian: 8, geode: 9 } })
            })
        })
        describe("find actions", () => {
            it("should find only nothing action when no ore is there", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: {} }
                const possibleActions = findPossibleActions(blueprints[0], 24, 1, state)
                expect(possibleActions).toStrictEqual([Action.doNothing])
            })
            it("should find buildClay action when there are two pieces of ore", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: { ore: 2} }
                const possibleActions = findPossibleActions(blueprints[0], 24, 1, state)
                expect(possibleActions).toStrictEqual([Action.doNothing, Action.buildClayRobot])
            })
            it("should find buildClay, buildOreAction action when there are four pieces of ore", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: { ore: 4} }
                const possibleActions = findPossibleActions(blueprints[0], 24, 1, state)
                expect(possibleActions).toStrictEqual([Action.doNothing, Action.buildOreRobot, Action.buildClayRobot])
            })
            it("should find buildClay, buildOreAction, buildGeode action when there are four pieces of ore and twelve of obsidian", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: { ore: 4, obsidian: 12} }
                const possibleActions = findPossibleActions(blueprints[0], 24, 1, state)
                expect(possibleActions).toStrictEqual([Action.doNothing, Action.buildOreRobot, Action.buildClayRobot, Action.buildGeodeRobot])
            })
            it("should find only do nothing when last minute", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: { ore: 4, obsidian: 12} }
                const possibleActions = findPossibleActions(blueprints[0], 24, 24, state)
                expect(possibleActions).toStrictEqual([Action.doNothing])
            })
            it("should build only geode two minutes before end", () => {
                const state: RobotState = { nrRobots: { ore: 1}, nrResources: { ore: 4, obsidian: 12} }
                const possibleActions = findPossibleActions(blueprints[0], 24, 22, state)
                expect(possibleActions).toStrictEqual([Action.doNothing, Action.buildGeodeRobot])
            })
        })
        describe("compare state isBetter", () => {
            it("should return true for compare empty states", () => {
                expect(isBetter({ nrRobots: {}, nrResources: {} }, { nrRobots: {}, nrResources: {} })).toBeFalsy()
            })
            it("should return true when state 2 is better", () => {
                expect(isBetter({ nrRobots: {}, nrResources: {} }, { nrRobots: {ore: 1}, nrResources: {} })).toBeFalsy()
                expect(isBetter({ nrRobots: {}, nrResources: {} }, { nrRobots: {}, nrResources: {clay: 1} })).toBeFalsy()
                expect(isBetter({ nrRobots: {ore: 1}, nrResources: {} }, { nrRobots: {ore: 2}, nrResources: {} })).toBeFalsy()
                expect(isBetter({ nrRobots: {}, nrResources: {clay: 1} }, { nrRobots: {}, nrResources: {clay: 3} })).toBeFalsy()
                expect(isBetter({ nrRobots: {ore: 1}, nrResources: {clay: 1} }, { nrRobots: {ore: 2}, nrResources: {clay: 1} })).toBeFalsy()
                expect(isBetter({ nrRobots: {ore: 1}, nrResources: {clay: 1} }, { nrRobots: {ore: 1}, nrResources: {clay: 3} })).toBeFalsy()
            })
            it("should return false when state 1 is better", () => {
                expect(isBetter({ nrRobots: {ore: 1}, nrResources: {} }, { nrRobots: {}, nrResources: {} })).toBeTruthy()
                expect(isBetter({ nrRobots: {}, nrResources: {clay: 1} }, { nrRobots: {}, nrResources: {} })).toBeTruthy()
                expect(isBetter({ nrRobots: {ore: 2}, nrResources: {} }, { nrRobots: {ore: 1}, nrResources: {} } )).toBeTruthy()
                expect(isBetter({ nrRobots: {}, nrResources: {clay: 3} }, { nrRobots: {}, nrResources: {clay: 1} })).toBeTruthy()
                expect(isBetter({ nrRobots: {ore: 2}, nrResources: {clay: 1} }, { nrRobots: {ore: 1}, nrResources: {clay: 1} } )).toBeTruthy()
                expect(isBetter({ nrRobots: {ore: 1}, nrResources: {clay: 3} }, { nrRobots: {ore: 1}, nrResources: {clay: 1} })).toBeTruthy()
            })
            it("should return false when mixed", () => {
                expect(isBetter({ nrRobots: {ore: 1}, nrResources: {} }, { nrRobots: {}, nrResources: {clay: 1} })).toBeFalsy()
                expect(isBetter({ nrRobots: {}, nrResources: {clay: 1} }, { nrRobots: {}, nrResources: {ore: 1} })).toBeFalsy()
            })
            it("should return false when equal", () => {
                expect(isBetter({ nrRobots: {ore: 1}, nrResources: {clay: 2, obsidian: 3} }, { nrRobots: {ore: 1}, nrResources: {clay: 2, obsidian: 3} })).toBeFalsy()
            })
        })
        describe("compare states equal", () => {
            it("should return true for compare empty states", () => {
                expect(isEqual({ nrRobots: {}, nrResources: {} }, { nrRobots: {}, nrResources: {} })).toBeTruthy()
            })
            it("should return true when state 2 is better", () => {
                expect(isEqual({ nrRobots: {}, nrResources: {} }, { nrRobots: {ore: 1}, nrResources: {} })).toBeFalsy()
                expect(isEqual({ nrRobots: {}, nrResources: {} }, { nrRobots: {}, nrResources: {clay: 1} })).toBeFalsy()
                expect(isEqual({ nrRobots: {ore: 1}, nrResources: {} }, { nrRobots: {ore: 2}, nrResources: {} })).toBeFalsy()
                expect(isEqual({ nrRobots: {}, nrResources: {clay: 1} }, { nrRobots: {}, nrResources: {clay: 3} })).toBeFalsy()
                expect(isEqual({ nrRobots: {ore: 1}, nrResources: {clay: 1} }, { nrRobots: {ore: 2}, nrResources: {clay: 1} })).toBeFalsy()
                expect(isEqual({ nrRobots: {ore: 1}, nrResources: {clay: 1} }, { nrRobots: {ore: 1}, nrResources: {clay: 3} })).toBeFalsy()
            })
            it("should return false when state 1 is better", () => {
                expect(isEqual({ nrRobots: {ore: 1}, nrResources: {} }, { nrRobots: {}, nrResources: {} })).toBeFalsy()
                expect(isEqual({ nrRobots: {}, nrResources: {clay: 1} }, { nrRobots: {}, nrResources: {} })).toBeFalsy()
                expect(isEqual({ nrRobots: {ore: 2}, nrResources: {} }, { nrRobots: {ore: 1}, nrResources: {} } )).toBeFalsy()
                expect(isEqual({ nrRobots: {}, nrResources: {clay: 3} }, { nrRobots: {}, nrResources: {clay: 1} })).toBeFalsy()
                expect(isEqual({ nrRobots: {ore: 2}, nrResources: {clay: 1} }, { nrRobots: {ore: 1}, nrResources: {clay: 1} } )).toBeFalsy()
                expect(isEqual({ nrRobots: {ore: 1}, nrResources: {clay: 3} }, { nrRobots: {ore: 1}, nrResources: {clay: 1} })).toBeFalsy()
            })
            it("should return false when mixed", () => {
                expect(isEqual({ nrRobots: {ore: 1}, nrResources: {} }, { nrRobots: {}, nrResources: {clay: 1} })).toBeFalsy()
                expect(isEqual({ nrRobots: {}, nrResources: {clay: 1} }, { nrRobots: {}, nrResources: {ore: 1} })).toBeFalsy()
            })
            it("should return true when equal", () => {
                expect(isEqual({ nrRobots: {ore: 1}, nrResources: {clay: 2, obsidian: 3} }, { nrRobots: {ore: 1}, nrResources: {clay: 2, obsidian: 3} })).toBeTruthy()
            })
        })
        describe("compress ActionsAndStates", () => {
            const actionsAndStates: ActionsAndState[] = [
                { actions: [], finalState: { nrRobots: {}, nrResources: {} }},
                { actions: [], finalState: { nrRobots: {ore: 1}, nrResources: {} }},
                { actions: [], finalState: { nrRobots: {}, nrResources: {clay: 1} }},
                { actions: [], finalState: { nrRobots: {ore: 1}, nrResources: {obsidian: 2} }},
                { actions: [], finalState: { nrRobots: {obsidian: 2}, nrResources: {clay: 1} }},
                { actions: [], finalState: { nrRobots: {ore: 1, geode: 1}, nrResources: {} }},
                { actions: [], finalState: { nrRobots: {}, nrResources: {clay: 1, geode: 1} }},
            ]
            const compressedActionsAndStates = compressActionsAndStates(actionsAndStates)
            it("should have compressed data", () => {
                expect(compressedActionsAndStates).toStrictEqual([
                    { actions: [], finalState: { nrRobots: {ore: 1}, nrResources: {obsidian: 2} }},
                    { actions: [], finalState: { nrRobots: {obsidian: 2}, nrResources: {clay: 1} }},
                    { actions: [], finalState: { nrRobots: {ore: 1, geode: 1}, nrResources: {} }},
                    { actions: [], finalState: { nrRobots: {}, nrResources: {clay: 1, geode: 1} }},
                ])
            })
        })
        describe("find max robots for a blueprint", () => {
            it("should find the max robots for blueprint 0", () => {
                const maxRobots = findMaxRobots(blueprints[0])
                expect(maxRobots).toStrictEqual({
                    ore: 4,
                    clay: 14,
                    obsidian: 7
                })
            })
        })
        describe("estimate upper bound for a certain state", () => {
            const initialState = { nrRobots: { ore: 1}, nrResources: {} }
            let upperBoundState = estimateUpperBoundState(initialState, blueprints[0], 10, 1)
            expect(upperBoundState.nrResources["geode"]).toBe(6)
        })
        describe("find solution for some goals", () => {
            it("should need to do nothing for a time span of 1 minute, searching for ore", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 1, "ore")
                expect(actions).toStrictEqual([Action.doNothing])
                expect(finalState.nrResources["ore"]).toBe(1)
            })
            it("should need to do nothing for a time span of 2 minutes, searching for ore", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 2, "ore")
                expect(actions).toStrictEqual([Action.doNothing, Action.doNothing])
                expect(finalState.nrResources["ore"]).toBe(2)
            })
            it("should need to do nothing for a time span of 4 minutes, searching for ore", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 4, "ore")
                expect(actions).toStrictEqual([Action.doNothing, Action.doNothing, Action.doNothing, Action.doNothing])
                expect(finalState.nrResources["ore"]).toBe(4)
            })
            it("should need to build clay robot for a time span of 4 minutes, searching for clay", () => {
                const { finalState: finalState, actions: actions } = findBestPlan(blueprints[0], 4, "clay")
                expect(actions).toStrictEqual([Action.doNothing, Action.doNothing, Action.buildClayRobot, Action.doNothing])
                expect(finalState.nrRobots["ore"]).toBe(1)
                expect(finalState.nrRobots["clay"]).toBe(1)
                expect(finalState.nrResources["ore"]).toBe(2)
            })
            it("should find the best plan, searching for geode in example 1", () => {
                const { finalState: finalState, actions: _ } = findBestPlan(blueprints[0], 24, "geode")
                expect(finalState.nrResources["geode"]).toBe(9)
            })
            it("should find the best plan, searching for geode in example 2", () => {
                const { finalState: finalState, actions: _ } = findBestPlan(blueprints[1], 24, "geode")
                expect(finalState.nrResources["geode"]).toBe(12)
            })
        })
        describe("solve example", () => {
            it("should calculate quality level sum", () => {
                const qualityLevels = blueprints.map((blueprint, index) => findQuality(index+1, blueprint, 24, "geode"))
                const sum = calculateSum(qualityLevels, x => x)
                expect(sum).toBe(33)
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay19.txt")
        const lines = parseLines(input)
        const blueprints = parseBlueprints(lines)
        it("should have parsed lines and blueprints", () => {
            expect(lines.length).toBe(30)
            expect(blueprints.length).toBe(30)
        })
        describe("Part 1", () => {
            it("should find solution", () => {
                const qualityLevels = blueprints.map((blueprint, index) => findQuality(index+1, blueprint, 24, "geode"))
                const sum = calculateSum(qualityLevels, x => x)
                expect(sum).toBe(1147)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
            })
        })
    })
})
