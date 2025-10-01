import { createTokenSchema, deleteTokenSchema } from '../../lib/schemas.js';
import { createToken, deleteToken, filterToken, getToken, getTokens } from '../../lib/tokens.js';
export async function get(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    if (req.user.token.type !== 'user')
        return res.sendStatus(418);
    const tokens = await getTokens(req.user.id);
    res.json(tokens
        .map(token => {
        if (token.hash === req.user.token.hash)
            return {
                ...token,
                me: true
            };
        else
            return token;
    })
        .map(filterToken)
        .sort((a, b) => b.usedAt - a.usedAt)
        .sort(a => (a.me ? -1 : 1)));
}
export async function post(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    if (req.user.token.type !== 'user')
        return res.sendStatus(418);
    const parsed = createTokenSchema.safeParse(req.body);
    if (!parsed.success)
        return res.sendStatus(400);
    const { name } = parsed.data;
    const token = await createToken({
        userId: req.user.id,
        type: 'uploader',
        name: name
    });
    return res.json(token);
}
export async function del(req, res) {
    if (!req.user)
        return res.sendStatus(401);
    if (req.user.token.type !== 'user')
        return res.sendStatus(418);
    const parsed = deleteTokenSchema.safeParse(req.body);
    if (!parsed.success)
        return res.sendStatus(400);
    const { id } = parsed.data;
    const token = await getToken({ id });
    if (!token)
        return res.sendStatus(404);
    if (token.userId !== req.user.id)
        return res.sendStatus(404);
    await deleteToken({ id });
    res.sendStatus(204);
}
