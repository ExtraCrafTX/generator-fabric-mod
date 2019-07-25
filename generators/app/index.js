'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

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
      }
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  writing() {
  }
};
