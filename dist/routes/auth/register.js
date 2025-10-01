import { checkRegistrationAllowed } from '../../lib/config.js';
import { registerSchema } from '../../lib/schemas.js';
import { createToken } from '../../lib/tokens.js';
import { createUser, userExists } from '../../lib/users.js';
export async function post(req, res) {
    if (!(await checkRegistrationAllowed()))
        return res.sendStatus(403);
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.sendStatus(400);
    const { username, password } = parsed.data;
    if (await userExists(username))
        return res.sendStatus(409);
    const user = await createUser({ username, password });
    const token = await createToken({
        userId: user.id,
        userAgent: req.headers['user-agent']
    });
    return res.json({
        token: token.token,
        user: {
            id: user.id,
            username: user.username
        }
    });
}
