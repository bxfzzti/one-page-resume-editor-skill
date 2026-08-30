import { AppHeader } from "@/components/app-header";
import { FactDrawer } from "./fact-drawer";
import { MobileTabs } from "./mobile-tabs";
import { ResultPanel } from "./result-panel";
import { VersionSidebar } from "./version-sidebar";

type Project = {
  id: string;
  title: string;
  versions: Array<{ id: string; title: string; versionType: string; contentJson: unknown }>;
  facts: Array<{ id: string; status: string; sourceExcerpt: string; riskText: string | null }>;
  runs: Array<{ id: string; state: string; serviceKind: string; outputSnapshot?: unknown; errorCode?: string | null }>;
  resumeText?: string;
};

export function WorkspaceShell({ project }: { project: Project }) {
  const latest = project.versions[0];
  const result = <ResultPanel version={latest} projectId={project.id} resumeText={project.resumeText ?? ""} runs={project.runs} />;
  const facts = <FactDrawer facts={project.facts} />;
  return (
    <main className="min-h-screen bg-stone-50">
      <AppHeader />
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-neutral-200 pb-5">
          <p className="text-sm text-teal-700">我的简历</p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-950">{project.title}</h1>
        </div>
        <MobileTabs result={result} facts={facts} />
        {project.versions.length === 0 ? (
          <div className="hidden md:block">{result}</div>
        ) : (
          <div className="hidden gap-5 md:grid md:grid-cols-[190px_minmax(0,1fr)_260px]">
            <VersionSidebar versions={project.versions} />
            {result}
            {facts}
          </div>
        )}
      </section>
    </main>
  );
}
