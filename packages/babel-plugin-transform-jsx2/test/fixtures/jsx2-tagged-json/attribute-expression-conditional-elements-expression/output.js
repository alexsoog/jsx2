function test() {
  return jsx2.templateResult`{"type":"div","key":"","ref":null,"props":{"attr":${cond && jsx2.templateResult`{"type":"inner","key":"","ref":null,"props":{"children":${x}}}`}}}`;
}
