export const composeOptimisedFilePath = (filePath: string) => {
  const parts = filePath.split("/");
  const filename = parts.pop();

  return [...parts, `optimised-${filename}`].join("/");
};