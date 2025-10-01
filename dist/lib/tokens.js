import prisma from './prisma.js';
import { hash, random } from './utils.js';
export const filterToken = token => ({
    id: token.id,
    type: token.type,
    createdAt: token.createdAt,
    usedAt: token.usedAt,
    userAgent: token.userAgent,
    me: token.me || false,
    name: token.name
});
export async function createToken({ userId, type, userAgent, name }) {
    const token = random(64);
    const details = await prisma.token.create({
        data: {
            userId,
            hash: hash(token),
            type: type || 'user',
            userAgent: userAgent || null,
            name: name || null
        }
    });
    return {
        ...details,
        token
    };
}
export async function getToken({ id, token }) {
    return await prisma.token.findFirst({
        where: token ? { hash: hash(token) } : { id },
        include: {
            user: true
        }
    });
}
export async function getTokens(userId) {
    return await prisma.token.findMany({
        where: {
            userId
        }
    });
}
export async function deleteToken({ id, token }) {
    if (id)
        return await prisma.token.delete({
            where: {
                id
            }
        });
    else if (token)
        return await prisma.token.delete({
            where: {
                hash: hash(token)
            }
        });
}
export async function deleteTokens({ userId, keep }) {
    return await prisma.token.deleteMany({
        where: {
            userId,
            NOT: {
                hash: hash(keep)
            }
        }
    });
}
export async function useToken(token) {
    const found = await getToken({ token });
    if (!found)
        return false;
    const updated = await prisma.token.update({
        where: {
            id: found.id
        },
        data: {
            usedAt: new Date()
        },
        include: {
            user: true
        }
    });
    return updated;
}
