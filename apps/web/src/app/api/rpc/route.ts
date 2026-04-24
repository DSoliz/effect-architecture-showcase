import { rpcHandler } from "@/lib/rpc/server";

export const POST = (request: Request) => rpcHandler(request);
