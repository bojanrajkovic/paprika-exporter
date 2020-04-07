# paprika-exporter

A tool to export recipes from a Paprika Sync account into 2 formats:

1. A Markdown format compatible with static site generators/blogs like Jekyll.
   The recipe notes, description, and directions are included in the body, and
   recipe metadata is in the YAML frontmatter.
2. The .paprikarecipe format that can be imported into Paprika. The format is
   actually just gzipped JSON text, more or less directly from the API.

## Usage

```shell
npm install -g @bojanrajkovic/paprika-exporter
paprika-exporter -h
```

`paprika-explorer` takes 2 parameters: the first is a directory where
Markdown-format recipes should be writen, and the second is a directory where
importable Paprika-format recipes should be written.