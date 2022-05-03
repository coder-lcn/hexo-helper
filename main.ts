#!/usr/bin/env node

const title = process.argv.slice(2).join(" ");

if (Boolean(title) === false) throw new Error("缺少文章标题");

import { JSONFile, Low } from "lowdb";
import { join } from "path";
import { Category, Props, Tag } from "./types";
import inquirer from "inquirer";
import dayjs from "dayjs";
import { writeFile } from "fs/promises";

async function getCategory(category: Category[]) {
  const categoryList: string[] = [];

  const currLevelTag = async (category: Category[], parent?: string) => {
    const list = category.filter((item) => Boolean(item.parent) === false);

    const { newCategory } = await inquirer.prompt([
      {
        type: "list",
        name: "newCategory",
        message: categoryList.length ? `选择[${parent}]的子分类` : "选择分类",
        choices: list.map((item) => item.name),
      },
    ]);

    if (newCategory) {
      const target = category.find((item) => item.name === newCategory)!;

      const childCateGory = category.filter((item) => {
        const result = item.parent && item.parent === target._id;
        delete item.parent;
        return result;
      });

      categoryList.push(newCategory);
      childCateGory.length && (await currLevelTag(childCateGory, target.name));
    }

    return categoryList;
  };

  return currLevelTag(category);
}

async function getTag(tag: Tag[]) {
  const { newTag } = await inquirer.prompt([
    {
      type: "list",
      name: "newTag",
      message: "选择标签",
      choices: tag.map((item) => item.name),
    },
  ]);
  return newTag;
}

async function createArticle(category: string[], tag: string) {
  const renderCategory =
    "  " +
    category
      .reduce((result, item) => {
        result += `  - ${item}\r\n`;
        return result;
      }, "")
      .trim();

  const template = `---
title: ${title}
date: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}
categories:
${renderCategory}
tags: ${tag}
---

<!-- more -->

`;

  try {
    const posts = join(process.cwd(), "source/_posts");
    const fileName = title.replace(" ", "-") + ".md";

    await writeFile(join(posts, fileName), template);
    console.log("创建新文章：" + title);
  } catch (error) {
    throw error;
  }
}

async function main() {
  const file = join(process.cwd(), "db.json");
  const adapter = new JSONFile<Props>(file);
  const db = new Low<Props>(adapter);
  await db.read();

  if (db.data) {
    const { Tag, Category } = db.data.models;
    const category = await getCategory(Category);
    const tag = await getTag(Tag);
    await createArticle(category, tag);
  } else {
    throw new Error("找不到 db.json");
  }
}

main();
