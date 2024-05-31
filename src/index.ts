import path from 'path';

import * as core from '@actions/core';
import * as github from '@actions/github';
import fs from 'fs-extra';

import config from './config';
import ci from './lib/cli';

async function run(): Promise<void> {
  try {
    const projectType = core.getInput('project_type') || 'miniProgram';
    const actionType = core.getInput('action_type') || 'preview';
    const subcommand = core.getInput('subcommand');
    const projectPath = core.getInput('project_path') || './';
    const version = core.getInput('version') || '1.0.0';
    const remark = core.getInput('remark');
    const robotsAttr = core.getInput('robots');
    const options = core.getInput('command_options') || '';

    const { MINI_APP_ID, MINI_APP_PRIVATE_KEY, GITHUB_WORKSPACE: sourceDir = '' } = process.env;
    const uploadDir = path.join(sourceDir, projectPath);

    const timestamp = new Date().getTime();
    const privateKeyDir = `./private.${timestamp}.key`;
    await fs.outputFile(privateKeyDir, MINI_APP_PRIVATE_KEY);

    const commandOptions = options.replace('\n', '').split(' ').map(v => {
      const map = v.split('=');
      if(map[1]) {
        return `${map[0]} ${map[1]}`;
      }

      return `${map[0]} 'true'`;
    });

    const existsRobotConfig = await fs.pathExists(path.join(sourceDir, '.mini-program-robot.js'))

    let robotConfig: any= {};

    if(robotsAttr) {
      robotsAttr.replace('\n', '').split(' ').forEach(v => {
        const map = v.split('=');
        if(map[1]) {
          robotConfig[map[0]] = map[1];
        } else {
          robotConfig[map[0]] = 28;
        }
      });
    } else if(existsRobotConfig) {
      robotConfig = require(path.join(sourceDir, '.mini-program-robot.js'));
    } else {
      robotConfig = config;
    }

    const author = github.context.actor;
    const branch = github.context.ref.replace(/refs\/heads\//, '');
    const pullRuestTitle = github.context.payload.pull_request?.title;
    const robot = robotConfig[branch] || robotConfig[author] || 28;
    const commits = [...(github.context.payload.commits || []),{message: `robot ${robot} trigger this pub`}].filter(t=>t);

    const project = new ci({
      sourceDir,
      projectType,
      version,
      uploadDir,
      // ignores,
      baseArgs: [
        'miniprogram-ci@1.9.15',
        ...subcommand.split(' '),
        `${actionType}`,
        '--project-type', `${projectType}`,
        '--pp', `${uploadDir}`,
        '--pkp', `${privateKeyDir}`,
        '--appid', `${MINI_APP_ID}`,
        '--uv', `${version}`,
        '--ud', `'${remark || pullRuestTitle || commits[0].message}'`,
        '-r', `${robot}`,
        ...commandOptions,
      ]
    })

    const handle: 'cloud' | 'get_dev_source_map' | 'pack_npm' | 'preview' | 'upload' | 'pack_npm_manually' | 'custom' = actionType.replace(/\-/, '_') as any;

    await project[handle]();

    console.log('upload success done');
  } catch (error) {
    core.setFailed(error);
  }
}

run();
