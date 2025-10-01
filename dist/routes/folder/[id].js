import { deleteFolder, filterFolder, getFolder, updateFolder } from '../../lib/files.js';
import { updateFolderSchema } from '../../lib/schemas.js';
export async function get(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    const { id } = req.params;
    if (!id)
        return res.sendStatus(400);
    const folder = await getFolder(id);
    if (!folder)
        return res.sendStatus(404);
    if (folder.ownerId !== req.user.id)
        return res.sendStatus(404);
    return res.json(filterFolder(folder));
}
export async function del(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    const { id } = req.params;
    if (!id)
        return res.sendStatus(400);
    const folder = await getFolder(id);
    if (!folder)
        return res.sendStatus(404);
    if (folder.ownerId !== req.user.id)
        return res.sendStatus(404);
    await deleteFolder(id);
    return res.sendStatus(204);
}
export async function patch(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    const { id } = req.params;
    if (!id)
        return res.sendStatus(400);
    const parsed = updateFolderSchema.safeParse(req.body);
    if (!parsed.success)
        return res.sendStatus(400);
    const folder = await getFolder(id);
    if (!folder)
        return res.sendStatus(404);
    if (folder.ownerId !== req.user.id)
        return res.sendStatus(404);
    await updateFolder(id, parsed.data);
    return res.sendStatus(204);
}
