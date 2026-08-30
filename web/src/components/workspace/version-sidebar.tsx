import Link from "next/link";

type Version = {
  id: string;
  title: string;
  versionType: string;
};

export function VersionSidebar({ versions }: { versions: Version[] }) {
  return (
    <aside className="border-r border-neutral-200 pr-4">
      <h2 className="text-sm font-semibold text-neutral-950">历史版本</h2>
      <div className="mt-3 space-y-2">
        {versions.map((version) => (
          <Link
            key={version.id}
            href={`?version=${version.id}`}
            className="block rounded-md border border-neutral-200 bg-white p-3 text-sm hover:border-teal-700"
          >
            <span className="block font-medium">{version.title}</span>
            <span className="mt-1 block text-xs text-neutral-500">{version.versionType}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
