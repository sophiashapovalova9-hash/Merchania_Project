import { updateProfile } from './users.repo.js';
import { listWishlist, toggleWishlist } from './support.repo.js';
import { ok, list } from '../utils/http.js';
import { requireInt, requireString, optionalString } from '../utils/validate.js';

export async function me(req, res) {
  return ok(res, req.user);
}

export async function patchProfile(req, res) {
  const data = {
    firstName: requireString(req.body?.firstName, 'firstName', { max: 50 }),
    lastName: requireString(req.body?.lastName, 'lastName', { max: 50 }),
    patronymic: optionalString(req.body?.patronymic, 'patronymic', { max: 50 }),
    phone: optionalString(req.body?.phone, 'phone', { max: 30 }),
  };

  const user = await updateProfile(req.user.user_id, data);
  return ok(res, user);
}

export async function wishlist(req, res) {
  return list(res, await listWishlist(req.user.user_id));
}

export async function toggleWishlistItem(req, res) {
  const productId = requireInt(req.params.productId, 'productId');
  return ok(res, await toggleWishlist(req.user.user_id, productId));
}
