# paprika-exporter

A tool to export recipes from a Paprika Sync account into 2 formats:

1. A Markdown format compatible with static site generators/blogs like Jekyll.
   The recipe notes, description, and directions are included in the body, and
   recipe metadata is in the YAML frontmatter.
2. The .paprikarecipe format that can be imported into Paprika. The format is
   actually just gzipped JSON text, more or less directly from the API.

## Usage

Until I manage to publish this to NPM:

```shell
git clone https://github.com/bojanrajkovic/paprika-exporter
cd paprika-exporter
npm run build
npm install -g
paprika-exporter -h
```