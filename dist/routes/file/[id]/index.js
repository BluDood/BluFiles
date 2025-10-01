import { deleteFile, filterFile, getFile, updateFile } from '../../../lib/files.js';
import { updateFileSchema } from '../../../lib/schemas.js';
export async function get(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    const { id } = req.params;
    if (!id)
        return res.sendStatus(400);
    const file = await getFile(id);
    if (!file)
        return res.sendStatus(404);
    if (file.ownerId !== req.user.id)
        return res.sendStatus(404);
    return res.json(filterFile(file));
}
export async function del(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    const { id } = req.params;
    if (!id)
        return res.sendStatus(400);
    const file = await getFile(id);
    if (!file)
        return res.sendStatus(404);
    if (file.ownerId !== req.user.id)
        return res.sendStatus(404);
    await deleteFile(id);
    return res.sendStatus(204);
}
export async function patch(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    const { id } = req.params;
    if (!id)
        return res.sendStatus(400);
    const parsed = updateFileSchema.safeParse(req.body);
    if (!parsed.success)
        return res.sendStatus(400);
    const file = await getFile(id);
    if (!file)
        return res.sendStatus(404);
    if (file.ownerId !== req.user.id)
        return res.sendStatus(404);
    await updateFile(id, parsed.data);
    return res.sendStatus(204);
}
