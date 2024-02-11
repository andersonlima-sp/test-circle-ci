import * as CircleCI from '@circleci/circleci-config-sdk';

export const definition = new CircleCI.reusable.ReusableCommand(
  'configure-aws',
  [
    new CircleCI.commands.Run({
      name: 'Configure AWS',
      command: `
aws configure --profile tooling set aws_access_key_id "\${DEV_AWS_ACCESS_KEY_ID}"
aws configure --profile tooling set aws_secret_access_key "\${DEV_AWS_SECRET_ACCESS_KEY}"

if [ "<< parameters.stage >>" == "production" ]; then
  aws configure --profile default set aws_access_key_id "\${PROD_AWS_ACCESS_KEY_ID}"
  aws configure --profile default set aws_secret_access_key "\${PROD_AWS_SECRET_ACCESS_KEY}"
elif [ "<< parameters.stage >>" == "staging" ]; then
  aws configure --profile default set aws_access_key_id "\${STAGING_AWS_ACCESS_KEY_ID}"
  aws configure --profile default set aws_secret_access_key "\${STAGING_AWS_SECRET_ACCESS_KEY}"
else
  aws configure --profile default set aws_access_key_id "\${DEV_AWS_ACCESS_KEY_ID}"
  aws configure --profile default set aws_secret_access_key "\${DEV_AWS_SECRET_ACCESS_KEY}"
fi

aws configure --profile default set region "\${REGION}"
`
    })
  ],
  new CircleCI.parameters.CustomParametersList([
    new CircleCI.parameters.CustomParameter('stage', 'string', 'staging')
  ]),
  'Configure AWS'
);

export function reuseCommand(params: {
  stage?: string;
}): CircleCI.reusable.ReusedCommand {
  return new CircleCI.reusable.ReusedCommand(definition, params);
}
