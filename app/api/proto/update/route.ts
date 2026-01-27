import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { GTFS_REALTIME_PROTOBUF_URLS } from '../../../../lib/stops';

export async function GET() {
    try {
        console.log('[proto-update] Starting protobuf files update...');

        const protoDir = path.join(process.cwd(), 'proto');

        if (!fs.existsSync(protoDir)) {
            fs.mkdirSync(protoDir, { recursive: true });
            console.log(`[proto-update] Created proto directory: ${protoDir}`);
        }

        const results = [];

        for (const [key, url] of Object.entries(GTFS_REALTIME_PROTOBUF_URLS)) {
            try {
                console.log(`[proto-update] Downloading ${key} from ${url}...`);
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const filename = path.basename(url);
                const filePath = path.join(protoDir, filename);

                fs.writeFileSync(filePath, response.data);
                console.log(`[proto-update] Saved ${filename}`);

                results.push({
                    key,
                    filename,
                    status: 'success',
                    size: response.data.length
                });
            } catch (error) {
                console.error(`[proto-update] Failed to download ${key}:`, error);
                results.push({
                    key,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'failed').length;

        console.log(`[proto-update] Completed: ${successCount} success, ${failCount} failed`);

        return NextResponse.json({
            success: failCount === 0,
            results,
            directory: protoDir,
            summary: {
                total: results.length,
                success: successCount,
                failed: failCount
            }
        });
    } catch (error) {
        console.error('[proto-update] Protobuf update failed:', error);
        return NextResponse.json(
            {
                error: 'Update failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}