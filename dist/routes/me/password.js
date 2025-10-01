import { authenticate, updateUser } from '../../lib/users.js';
export async function patch(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    if (req.user.token.type !== 'user')
        return res.sendStatus(418);
    const { id, username } = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
        return res.sendStatus(400);
    if (!(await authenticate({ username, password: currentPassword })))
        return res.sendStatus(401);
    await updateUser({ id, password: newPassword });
    res.sendStatus(204);
}
