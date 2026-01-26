import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { GTFS_REALTIME_PROTOBUF_URLS } from '../../../../lib/stops';

export async function GET() {
    try {
        const protoDir = path.join(process.cwd(), 'proto');

        if (!fs.existsSync(protoDir)) {
            fs.mkdirSync(protoDir, { recursive: true });
        }

        const results = [];

        for (const [key, url] of Object.entries(GTFS_REALTIME_PROTOBUF_URLS)) {
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const filename = path.basename(url);
                const filePath = path.join(protoDir, filename);

                fs.writeFileSync(filePath, response.data);
                results.push({ key, filename, status: 'success' });
            } catch (error) {
                console.error(`Failed to download ${key}`, error);
                results.push({ key, status: 'failed', error: (error as any).message });
            }
        }

        return NextResponse.json({ success: true, results, directory: protoDir });
    } catch (error) {
        console.error('Protobuf update failed', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}