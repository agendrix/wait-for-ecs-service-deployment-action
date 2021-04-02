
import * as core from "@actions/core";
import { exec } from "../../helpers/action/exec";

export async function validateClusterExists(clusterName: string) {
  core.info(`Validating that an ECS cluster with name ${clusterName} exists...`);
  const result = JSON.parse(
    await exec(`aws ecs describe-clusters --clusters ${clusterName}`)
  );
  if (result.clusters.length === 0) {
    throw new Error(`No ECS clusters with name ${clusterName} was found.`);
  }
}