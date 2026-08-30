import { VersionEditor } from "./version-editor";

type Version = {
  id: string;
  title: string;
  contentJson: unknown;
};

export function ResultPanel({ version }: { version?: Version }) {
  if (!version) {
    return (
      <section className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">继续当前任务</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">选择一项服务，系统会先展示本次积分消耗，再开始生成。</p>
      </section>
    );
  }
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-6">
      <p className="text-sm font-medium text-teal-700">当前结果</p>
      <h2 className="mt-1 text-xl font-semibold">{version.title}</h2>
      <pre className="mt-5 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md bg-neutral-50 p-4 text-sm leading-6 text-neutral-800">
        {JSON.stringify(version.contentJson, null, 2)}
      </pre>
      <VersionEditor version={version} />
    </section>
  );
}
