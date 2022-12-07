// Advent of code 2022 - day 07

import {readFileSync} from "fs";


export function readFileInput(path: string) {
    return readFileSync(path, 'utf8')
}

export function parseLines(input: string) {
    return input.split("\n").map(l => l.trim()).filter(l => l.length > 0)
}

class FileSystem {
    root: Directory = new Directory("")
    currentDir: Directory = this.root

    refreshSizes() {
        this.root.calculateSize()
    }

    findFiles(condition: (f: File | Directory) => boolean): (File | Directory)[] {
        return this.root.findFiles(condition)
    }
}

class Directory {
    parent: Directory | null = null
    name: string
    files: (File | Directory)[] = []
    size: number | undefined

    constructor(name: string, parent: Directory | null = null) {
        this.name = name
        this.parent = parent
    }

    findFile(name: string) {
        for (const f of this.files) {
            if (f.name === name) return f
        }
        return null
    }

    calculateSize() {
        for (const d of this.files) {
            if (d instanceof Directory) d.calculateSize()
        }
        this.size = 0
        for (const f of this.files) {
            this.size += f.size!
        }
    }

    findFiles(condition: (f: File | Directory) => boolean): (File | Directory)[] {
        const result: (File | Directory)[] = []
        this.findFilesRecursively(condition, result)
        return result
    }

    findFilesRecursively(condition: (f: File | Directory) => boolean, result: (File | Directory)[]) {
        if (condition(this)) result.push(this)
        for (const file of this.files) {
            if (file instanceof Directory) file.findFilesRecursively(condition, result)
            else if (condition(file)) result.push(file)
        }
    }
}

class CdCommand {
    readonly dir: string
    constructor(dir: string) {
        this.dir = dir
    }
}

class File {
    declare name: string
    declare size: number

    constructor(name: string, size: number) {
        this.name = name
        this.size = size
    }
    findFile() { throw new Error("No directory") }
}

class LsCommand {
    files: (File | Directory)[] = []

    constructor(files: (File | Directory)[]) {
        this.files = files
    }
}

function parseCommands(lines: string[]) {
    const result: (CdCommand | LsCommand)[] = []
    for (const line of lines) {
        if (line.startsWith("$ cd")) {
            const parts = line.split(" ")
            result.push(new CdCommand(parts[2]))
        } else if (line.startsWith("$ ls")) {
            result.push(new LsCommand([]))
        } else {
            const parts = line.split(" ")
            let fileOrDirectory: File | Directory
            if (parts[0] === "dir")
                fileOrDirectory = new Directory(parts[1], null)
            else
                fileOrDirectory = new File(parts[1], parseInt(parts[0]));
            (result[result.length-1] as LsCommand).files.push(fileOrDirectory)
        }
    }
    return result
}

function executeCommands(fileSystem: FileSystem, commandsOrFiles: (CdCommand | LsCommand)[]) {
    for (const commandOrFile of commandsOrFiles) {
        if (commandOrFile instanceof CdCommand) {
            if (commandOrFile.dir === "/") {
                fileSystem.currentDir = fileSystem.root
            } else if (commandOrFile.dir === "..") {
                if (fileSystem.currentDir.parent === null) {
                    console.log('Already at root')
                    return
                }
                fileSystem.currentDir = fileSystem.currentDir.parent
            } else {
                const d = fileSystem.currentDir.findFile(commandOrFile.dir)
                if (d === null) {
                    console.log(`Dir ${commandOrFile.dir} not found in ${fileSystem.currentDir.name}`)
                    return
                }
                if (!(d instanceof Directory)) {
                    console.log(`Dir ${commandOrFile.dir} no directory in ${fileSystem.currentDir.name}`)
                    return
                }
                fileSystem.currentDir = d
            }
        } else {
            fileSystem.currentDir.files = commandOrFile.files.map(f => {
                if (f instanceof Directory) f.parent = fileSystem.currentDir // set parent
                return f
            })
        }
    }
}

function sumOfSmallDirectories(fileSystem: FileSystem) {
    fileSystem.refreshSizes()
    const dirs = fileSystem.findFiles(
        f => f instanceof Directory && f.size! < 100000
    )
    let sum = 0
    for (const d of dirs) sum += d.size!
    return sum
}

function findDirectoriesToDelete(fileSystem: FileSystem) {
    fileSystem.refreshSizes()
    const spaceAvailable = 70000000 - fileSystem.root.size!
    const spaceNeeded = 30000000 - spaceAvailable
    const dirs =  fileSystem.findFiles(
        f => f instanceof Directory && f.size! >= spaceNeeded
    )
    dirs.sort((a, b) => a.size! - b.size!)
    return dirs
}

describe("Day 7", () => {
    const example = `
    $ cd /
    $ ls
    dir a
    14848514 b.txt
    8504156 c.dat
    dir d
    $ cd a
    $ ls
    dir e
    29116 f
    2557 g
    62596 h.lst
    $ cd e
    $ ls
    584 i
    $ cd ..
    $ cd ..
    $ cd d
    $ ls
    4060174 j
    8033020 d.log
    5626152 d.ext
    7214296 k`

    describe("Example", () => {
        const lines = parseLines(example);
        it("should have parsed 23 lines", () => {
            expect(lines.length).toBe(23)
        })
        describe("handle some input", () => {
            const filesystem = new FileSystem()
            it("should start with an empty filesystem", () => {
                expect(filesystem.currentDir.parent).toBeNull()
            })
        })
        describe("parse commands", () => {
            const commandsOrFiles = parseCommands(lines)
            expect (commandsOrFiles[0]).toStrictEqual(new CdCommand('/'))
            const filesAtRoot = [
                new Directory("a"),
                new File("b.txt", 14848514),
                new File("c.dat", 8504156),
                new Directory("d"),
            ]
            expect (commandsOrFiles[1]).toStrictEqual(new LsCommand(filesAtRoot))
            const fileSystem = new FileSystem()
            executeCommands(fileSystem, commandsOrFiles)
            describe("should have executed commands", () => {
                it("should have executed all commands", () => {
                    const dirE = fileSystem.root.findFile("a")!.findFile("e")!
                    expect(dirE).toBeInstanceOf(Directory)
                    expect(dirE.findFile("i")).toEqual({
                        name: "i",
                        size: 584
                    })
                    const dirD = fileSystem.root.findFile("d")!
                    expect(dirD).toBeInstanceOf(Directory)
                    if (dirD instanceof Directory) {
                        expect(dirD.files[0]).toEqual({
                            name: "j",
                            size: 4060174
                        })
                        expect(dirD.files[3]).toEqual({
                            name: "k",
                            size: 7214296
                        })
                    }
                })
                fileSystem.refreshSizes()
                describe("calculate sum size", () => {
                    const dirA = fileSystem.root.findFile("a")!
                    expect(dirA.size).toBe(94853)
                    const dirE = dirA.findFile("e")!
                    expect(dirE.size).toBe(584)
                    const dirD = fileSystem.root.findFile("d")!
                    expect(dirD.size).toBe(24933642)
                    const root = fileSystem.root
                    expect(root.size).toBe(48381165)
                })
                describe("find files recursively", () => {
                    const dirs = fileSystem.findFiles(
                        f => f instanceof Directory && f.size! < 100000
                    )!
                    expect(dirs.map(f => f.name)).toStrictEqual(["a", "e"])
                })
            })
            describe("calculate sum of small directories", () => {
                expect(sumOfSmallDirectories(fileSystem)).toBe(95437)
            })
            describe("find directories to delete", () => {
                const dirs = findDirectoriesToDelete(fileSystem)
                const dirSizes = dirs.map(d => d.size)
                expect(dirSizes).toStrictEqual([24933642, 48381165])
                expect(dirSizes[0]).toBe(24933642)
            })
        })
    })

    describe("Exercise", () => {
        const input = readFileInput("inputDay07.txt")
        const lines = parseLines(input)
        it("should have parsed lines", () => {
            expect(lines.length).toBe(1087)
        })
        const fileSystem = new FileSystem()
        describe("Part 1", () => {
            it("should find solution", () => {
                const commandsOrFiles = parseCommands(lines)
                executeCommands(fileSystem, commandsOrFiles)
                expect(sumOfSmallDirectories(fileSystem)).toBe(1611443)
            })
        })
        describe("Part 2", () => {
            it("should find solution", () => {
                const dirs = findDirectoriesToDelete(fileSystem)
                const dirSizes = dirs.map(d => d.size)
                expect(dirSizes[0]).toBe(2086088)
            })
        })
    })

})
