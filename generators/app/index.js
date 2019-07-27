'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

const LICENSES = [
  { name: 'Apache 2.0', value: 'Apache-2.0' },
  { name: 'MIT', value: 'MIT' },
  { name: 'Mozilla Public License 2.0', value: 'MPL-2.0' },
  { name: 'BSD 2-Clause (FreeBSD) License', value: 'BSD-2-Clause-FreeBSD' },
  { name: 'BSD 3-Clause (NewBSD) License', value: 'BSD-3-Clause' },
  { name: 'Internet Systems Consortium (ISC) License', value: 'ISC' },
  { name: 'GNU AGPL 3.0', value: 'AGPL-3.0' },
  { name: 'GNU GPL 3.0', value: 'GPL-3.0' },
  { name: 'GNU LGPL 3.0', value: 'LGPL-3.0' },
  { name: 'Unlicense', value: 'unlicense' },
  { name: 'No License (Copyrighted)', value: 'All-Rights-Reserved' }
];

function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(`Welcome to ${chalk.greenBright('generator-fabric-mod')}!`)
    );

    const prompts = [
      {
        type: 'input',
        name: 'mod_name',
        message: 'Name of your mod:',
        validate: async (input, hash) => {
          if (input.replace(/\s/g, ""))
            return true;
          else
            return chalk.redBright("The mod name may not be blank");
        }
      },
      {
        type: 'input',
        name: 'mod_id',
        message: `Mod id (${chalk.italic('this must be unique!')}):`,
        validate: async (input, hash) => {
          if (!input.replace(/\s/g, ""))
            return chalk.redBright("The mod id may not be blank");
          return true;
        }
      },
      {
        type: 'input',
        name: 'mod_description',
        message: 'Mod description:',
        validate: async (input, hash) => {
          if (!input.replace(/\s/g, ""))
            return chalk.redBright("The description may not be blank");
          return true;
        }
      },
      {
        type: 'input',
        name: 'mod_version',
        message: 'Mod version:',
        default: '0.1.0',
        validate: async (input, hash) => {
          let semVerRegex = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*))*)?(?:\+[\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*)?$/;
          if (!semVerRegex.test(input)) {
            return chalk.redBright("Please format your version according to SemVer");
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:',
        validate: async (input, hash) => {
          if (!input.replace(/\s/g, ""))
            return chalk.redBright("Author may not be blank");
          return true;
        },
        store: true
      },
      {
        type: 'input',
        name: 'homepage',
        message: 'Mod homepage:',
        validate: async (input, hash) => {
          if (!input) {
            return true;
          } else {
            if (isValidURL(input))
              return true;
            else
              return chalk.redBright("Please enter a valid URL or leave it blank");
          }
        }
      },
      {
        type: 'input',
        name: 'sources',
        message: 'Source code URL:',
        validate: async (input, hash) => {
          if (!input) {
            return true;
          } else {
            if (isValidURL(input))
              return true;
            else
              return chalk.redBright("Please enter a valid URL or leave it blank");
          }
        }
      },
      {
        type: 'list',
        name: 'license',
        message: 'Select a license:',
        choices: LICENSES,
        default: 1
      },
      {
        type: 'input',
        name: 'license_author',
        message: 'Name on license:',
        default: async hash => hash.author,
        validate: async (input, hash) => {
          if (!input.replace(/\s/g, ""))
            return chalk.redBright("Name may not be blank");
          return true;
        },
        when: async hash => hash.license !== 'unlicense'
      }
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  writing() {
  }
};
