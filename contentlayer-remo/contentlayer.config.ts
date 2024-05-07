import { spawn } from "node:child_process";
import { defineDocumentType } from "contentlayer/source-files";
import { makeSource } from "contentlayer/source-remote-files";

const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `docs/**/*.md`,
  fields: {
    title: {
      type: "string",
      required: false,
    },
    description: {
      type: "string",
      required: false,
    },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/posts/${doc._raw.flattenedPath}`,
    },
  },
}));

export const CollegeHomePage = defineDocumentType(() => ({
  name: "CollegeHomePage",
  filePathPattern: `colleges/**/*.mdx`,
  contentType: "mdx",
  fields: {
    name: {
      type: "string",
      required: true,
    },
    slogan: {
      type: "string",
    },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/posts/${doc._raw.flattenedPath}`,
    },
  },
}));

export const Course = defineDocumentType(() => ({
  name: "Course",
  filePathPattern: `courses/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    cover: {
      type: "string",
    },
    date: {
      type: "date",
      required: true,
    },
    published: {
      type: "boolean",
      default: true,
    },
    featured: {
      type: "boolean",
      default: false,
    },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/posts/${doc._raw.flattenedPath}`,
    },
  },
}));

export const Chapter = defineDocumentType(() => ({
  name: "Chapter",
  filePathPattern: `chapters/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/posts/${doc._raw.flattenedPath}`,
    },
  },
}));

const syncContentFromGit = async (contentDir: string) => {
  const syncRun = async () => {
    const gitUrl =
      "https://github.com/homebrew-college-club/vercel-college.git";
    await runBashCommand(`
      if [ -d  "${contentDir}" ];
        then
          cd "${contentDir}"; git pull;
        else
          git clone --depth 1 --single-branch ${gitUrl} ${contentDir};
      fi
    `);
  };

  let wasCancelled = false;
  let syncInterval;

  const syncLoop = async () => {
    console.log("Syncing content files from git");

    await syncRun();

    if (wasCancelled) return;

    syncInterval = setTimeout(syncLoop, 1000 * 60);
  };

  // Block until the first sync is done
  await syncLoop();

  return () => {
    wasCancelled = true;
    clearTimeout(syncInterval);
  };
};

const runBashCommand = (command: string) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [], { shell: true });

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => process.stdout.write(data));

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => process.stderr.write(data));

    child.on("close", function (code) {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });

export default makeSource({
  syncFiles: syncContentFromGit,
  contentDirPath: "nextjs-repo",
  contentDirInclude: ["courses"],
  documentTypes: [Post],
  disableImportAliasWarning: true,
});
