import { checkFolderCreationAllowed } from '../../lib/config.js';
import { createFolder, filterFolder, getRootFolder } from '../../lib/files.js';
import { createFolderSchema } from '../../lib/schemas.js';
export async function get(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    const folder = await getRootFolder(req.user.id);
    return res.json(filterFolder(folder));
}
export async function post(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    if (!(await checkFolderCreationAllowed(req.user.id)))
        return res.sendStatus(403);
    const parsed = createFolderSchema.safeParse(req.body);
    if (!parsed.success)
        return res.sendStatus(400);
    const { name, parentId } = parsed.data;
    const folder = await createFolder({
        name,
        parentId,
        ownerId: req.user.id
    });
    return res.json(filterFolder(folder));
}
