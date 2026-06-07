import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  chatAttachment: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 10 }, 
    pdf: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "16MB", maxFileCount: 5 },
    blob: { maxFileSize: "8MB", maxFileCount: 10 }
  })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;