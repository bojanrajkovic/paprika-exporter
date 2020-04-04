#!/usr/bin/env node

import { program } from "commander"
import "core-js"
import { resolve } from "path"
import * as winston from "winston"
import { getPassword, setPassword } from "./Keychain"
import { PaprikaApi } from "./PaprikaApi"
import { PaprikaExporter } from "./PaprikaExporter"

winston.configure({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.align(),
        winston.format.errors(),
        winston.format.simple()
    )
})

async function run(markdownTargetDirectory: string, importableTargetDirectory: string, cmdObj: any) {
    let token: string = ""

    try {
        token = await getPassword("paprika-exporter", "PaprikaApi")
    } catch (e) {
        winston.warn(e)
    }

    let paprika: PaprikaApi
    try {
        paprika = await PaprikaApi.login(token)
        await setPassword("paprika-exporter", "PaprikaApi", paprika.token)
    } catch (e) {
        winston.error(e)
        process.exit(1)
    }

    const exporter = new PaprikaExporter(
        paprika, 
        resolve(markdownTargetDirectory),
        resolve(importableTargetDirectory)
    )
    await exporter.export(<boolean>cmdObj.skipCacheCheck)
}

async function main() {
    program
        .version("0.99.0")
        .name("paprika-exporter")
        .description("Exports recipes from Paprika Sync into Markdown + .paprikarecipe for publishing")
        .arguments("paprika-exporter <markdownTarget> <importableTarget>")
        .option("-s, --skip-cache-check", "Skip the cache check on Markdown files and refresh all the recipes", false)
        .action(run)
    await program.parseAsync()
}

main()
