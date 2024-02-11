import { PipelineParameterLiteral } from '@circleci/circleci-config-sdk/dist/src/lib/Components/Parameters/types/CustomParameterLiterals.types';

export type ParameterParams = {
  name: string;
  parameter: PipelineParameterLiteral;
  defaultValue?: unknown;
  description?: string;
  enumValues?: string[];
};
