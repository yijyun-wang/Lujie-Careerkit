type GitHubRepoResponse = {
  name: string;
  full_name: string;
  stargazers_count: number;
  language: string | null;
  description: string | null;
};

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim();
  const repo = parseGitHubRepo(url);

  if (!repo) {
    return Response.json({ message: "請填寫有效的 GitHub 倉庫連結，例如 https://github.com/vercel/next.js。" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "LuJie-CareerKit",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return Response.json({ message: "沒有找到這個 GitHub 倉庫，請檢查連結或倉庫是否公開。" }, { status: 404 });
    }

    if (!response.ok) {
      return Response.json({ message: "GitHub 倉庫資訊讀取失敗，請稍後重試。" }, { status: response.status });
    }

    const data = (await response.json()) as GitHubRepoResponse;
    return Response.json({
      name: data.full_name || data.name,
      stars: data.stargazers_count,
      language: data.language ?? "",
      description: data.description ?? "",
    });
  } catch {
    return Response.json({ message: "無法連線 GitHub，請檢查網路後重試。" }, { status: 502 });
  }
}

function parseGitHubRepo(rawUrl: string | null | undefined) {
  if (!rawUrl) return null;
  const normalized = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  try {
    const url = new URL(normalized);
    if (url.hostname.toLowerCase() !== "github.com") return null;

    const [owner, rawName] = url.pathname.split("/").filter(Boolean);
    const name = rawName?.replace(/\.git$/, "");
    if (!owner || !name) return null;

    return { owner, name };
  } catch {
    return null;
  }
}
