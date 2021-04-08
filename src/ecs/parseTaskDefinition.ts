export default function parseTaskDefinitionArn(taskDefinitionArn: string) {
  const familyAndRevision = taskDefinitionArn.split("/").pop();
  if (familyAndRevision) {
    let [_family, _revision, rest] = familyAndRevision.split(":");
    if (!rest) return familyAndRevision;
  }

  throw new Error(`Task definition arn ${taskDefinitionArn} format was not recognized.`);
}