import { checkFileCreationAllowed } from '../../lib/config.js';
import { createFile, filterFile } from '../../lib/files.js';
import { createFileSchema } from '../../lib/schemas.js';
export async function post(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    const parsed = createFileSchema.safeParse(req.body);
    if (!parsed.success)
        return res.sendStatus(400);
    const { name, folderId, data } = parsed.data;
    if (!(await checkFileCreationAllowed(req.user.id, data.byteLength)))
        return res.sendStatus(403);
    const file = await createFile({
        name,
        folderId,
        ownerId: req.user.id,
        data
    });
    return res.json(filterFile(file));
}
