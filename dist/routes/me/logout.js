import { deleteToken } from '../../lib/tokens.js';
export async function post(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    if (req.user.token.type !== 'user')
        return res.sendStatus(418);
    await deleteToken({ id: req.user.token.id });
    return res.sendStatus(204);
}
