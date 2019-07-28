'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const request = require('request');
const xml2js = require('xml2js');

const KEYWORDS = ["abstract", "assert", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "default", "do", "double", "else", "enum", "extends", "false", "final", "finally", "float", "for", "goto", "if", "implements", "import", "instanceof", "int", "interface", "long", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "strictfp", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try", "void", "volatile", "while", "continue"];
const PACKAGE_REGEX = /^([A-Za-z$_][A-Za-z0-9$_]*\.)*[A-Za-z$_][A-Za-z0-9$_]*$/;
const IDENT_REGEX = /^[A-Za-z$_][A-Za-z0-9$_]*$/;
const LOOM_RECOMMENDED = '0.2.4-SNAPSHOT';
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

let mcVersions = [];
let defaultMcVersion = 0;

let fabricAPIVersions = [];

let yarnMappings = [];

let loomVersions = [];

let loaderVersions = [];

function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

function doubleTrim(str, amount) {
  return str.substring(amount, str.length - amount);
}

function getJSON(url){
  return new Promise((resolve, reject)=>{
    request.get(
      {url, json: true},
      (err, res, data)=>{
        if(err){
          reject(err);
        }else if(res.statusCode != 200){
          reject(res.statusCode);
        }else{
          resolve(data);
        }
      }
    )
  });
}

function getXML(url) {
  return new Promise((resolve, reject)=>{
    request.get(
      { url },
      (err, res, data) => {
        if (err) {
          reject(err);
        } else if (res.statusCode != 200) {
          reject(res.statusCode);
        } else {
          xml2js.parseString(data, (err, res) => {
            if(err){
              reject(err);
            }else{
              resolve(res);
            }
          });
        }
      }
    );
  });
}

module.exports = class extends Generator {
  async initializing(){
    let data;
    //MC versions
    data = await getJSON('https://meta.fabricmc.net/v2/versions/game');
    data.forEach((version) => {
      mcVersions.push(version.version);
    });
    for (let i = 0; i < data.length; i++) {
      if (data[i].stable) {
        defaultMcVersion = i;
        break;
      }
    }
    //Fabric API versions
    data = await getJSON('https://addons-ecs.forgesvc.net/api/v2/addon/306612/files');
    let versionRegex = /\[.+\]/;
    data.forEach((version) => {
      if (version.displayName.startsWith('[')) {
        version.mcVersion = doubleTrim(version.displayName.match(versionRegex)[0], 1);
        let val = 0;
        let found = false;
        for (let i = 0; i < mcVersions.length; i++) {
          if (version.mcVersion == mcVersions[i]) {
            val = i;
            found = true;
          }
        }
        if (!found)
          val += data.length;
        version.mcVersionIndex = val;
        fabricAPIVersions.push({ name: version.displayName, value: version });
      }
    });
    fabricAPIVersions.sort((a, b) => {
      let verA = a.value.mcVersionIndex;
      let verB = b.value.mcVersionIndex;
      if (verA == verB) {
        let buildRegex = /build \d+/;
        let buildA = a.name.match(buildRegex)[0].substring(6);
        let buildB = b.name.match(buildRegex)[0].substring(6);
        return buildB - buildA;
      }
      return verA - verB;
    });
    //Yarn mapping versions
    data = await getJSON('https://meta.fabricmc.net/v2/versions/yarn');
    data.forEach((mapping) => {
      yarnMappings.push({ name: mapping.version, value: mapping });
    });
    //Loom versions
    data = await getXML('https://maven.fabricmc.net/net/fabricmc/fabric-loom/maven-metadata.xml');
    data.metadata.versioning[0].versions[0].version.forEach((version) => {
      loomVersions.push(version);
    });
    //Loader versions
    data = await getJSON('https://meta.fabricmc.net/v2/versions/loader');
    data.forEach((loader) => {
      loaderVersions.push({ name: loader.version, value: loader });
    });
  }

  prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay(`Welcome to ${chalk.greenBright('generator-fabric-mod')}!`)
    );

    const prompts = [
      {
        type: 'list',
        name: 'minecraft_version',
        message: 'Minecraft version:',
        choices: mcVersions,
        default: defaultMcVersion
      },
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
      },
      {
        type: 'input',
        name: 'mod_package',
        message: 'Main package:',
        validate: async (input, hash) => {
          if (PACKAGE_REGEX.test(input)) {
            let idents = input.split(".");
            for (let i = 0; i < idents.length; i++) {
              if (KEYWORDS.includes(idents[i])) {
                return chalk.redBright(idents[i] + " is a reserved keyword");
              }
            }
          } else {
            return chalk.redBright("Please enter a valid java package name");
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'main_class',
        message: 'Mod initialiser class:',
        default: async (hash) => {
          return hash.mod_name.replace(/[\s\-]/g, "");
        },
        validate: async (input, hash) => {
          if (IDENT_REGEX.test(input)) {
            if (KEYWORDS.includes(input)) {
              return chalk.redBright(input + " is a reserved keyword");
            }
          } else {
            return chalk.redBright("Please enter a valid class name");
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'use_mixins',
        message: 'Use mixins?',
        default: true
      },
      {
        type: 'confirm',
        name: 'use_api',
        message: 'Use Fabric API?',
        default: true
      },
      {
        type: 'list',
        name: 'fabric_api_version',
        message: `Fabric API version (${chalk.italic('check curseforge for compatibilty')}):`,
        choices: fabricAPIVersions,
        default: async (hash) => {
          let versionIndex = 0;
          for (let i = 0; i < mcVersions.length; i++) {
            if (hash.minecraft_version == mcVersions[i]) {
              versionIndex = i;
              break;
            }
          }
          for (let i = 0; i < fabricAPIVersions.length; i++) {
            if (fabricAPIVersions[i].value.mcVersionIndex >= versionIndex)
              return i;
          }
          return 0;
        },
        when: async (hash) => hash.use_api,
        filter: async (input) => {
          let name = input.displayName;
          let buildNum = name.match(/build \d+/)[0].substring(6);
          let version = name.match(/API \d+\.\d+\.\d+/)[0].substring(4);
          return version + "+" + "build." + buildNum;
        }
      },
      {
        type: 'list',
        name: 'yarn_mappings',
        message: 'Yarn mappings:',
        choices: async (hash) => {
          return yarnMappings.filter((mapping) => {
            return mapping.value.gameVersion == hash.minecraft_version;
          });
        },
        filter: async (input) => input.version
      },
      {
        type: 'list',
        name: 'loom_version',
        message: 'Loom version:',
        choices: loomVersions,
        default: async (hash) => {
          for (let i = 0; i < loomVersions.length; i++) {
            if (loomVersions[i] == LOOM_RECOMMENDED)
              return i;
          }
        },
      },
      {
        type: 'list',
        name: 'loader_version',
        message: 'Loader version (use latest unless you know what you are doing):',
        choices: loaderVersions,
        filter: async (input) => input.version
      },
      {
        type: 'input',
        name: 'maven_group',
        message: 'Maven group:',
        default: async (hash) => hash.mod_package,
        validate: async (input, hash) => {
          if (PACKAGE_REGEX.test(input)) {
            let idents = input.split(".");
            for (let i = 0; i < idents.length; i++) {
              if (KEYWORDS.includes(idents[i])) {
                return chalk.redBright(idents[i] + " is a reserved keyword");
              }
            }
          } else {
            return chalk.redBright("Please enter a valid java package name");
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'archives_base_name',
        message: 'Archive base name:',
        default: async (hash) => hash.mod_id,
        validate: async (input, hash) => {
          if (!input.replace(/\s/g, ""))
            return chalk.redBright("Name may not be blank");
          return true;
        },
      }
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  writing() {
    this.fs.copy(
      this.templatePath('.gitignore'),
      this.destinationPath('.gitignore')
    );
    this.fs.copy(
      this.templatePath('gradlew'),
      this.destinationPath('gradlew')
    );
    this.fs.copy(
      this.templatePath('gradlew.bat'),
      this.destinationPath('gradlew.bat')
    );
    this.fs.copy(
      this.templatePath('gradle'),
      this.destinationPath('gradle')
    );
    this.fs.copy(
      this.templatePath('settings.gradle'),
      this.destinationPath('settings.gradle')
    );
  }
};
