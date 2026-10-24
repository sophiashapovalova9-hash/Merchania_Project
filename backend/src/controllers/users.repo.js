import { getDb } from '../db/index.js';
import { q } from '../db/params.js';

export async function findUserById(userId) {
  const { rows } = await getDb().query(
    `
    SELECT ua.UserID AS user_id, ua.Email AS email, r.RoleName AS role_name,
           up.FirstName AS first_name, up.LastName AS last_name,
           up.Patronymic AS patronymic, up.Phone AS phone,
           ad.ArtistID AS artist_id, ad.ShopName AS shop_name
    FROM UserAccount ua
    JOIN Role r ON r.RoleID = ua.RoleID
    LEFT JOIN UserProfile up ON up.UserID = ua.UserID
    LEFT JOIN ArtistDetail ad ON ad.UserID = ua.UserID
    WHERE ua.UserID = @userId;`,
    { userId: q.int(userId) },
  );
  return rows[0] ?? null;
}

export async function updateProfile(userId, { firstName, lastName, patronymic, phone }) {
  await getDb().query(
    `
    UPDATE UserProfile
       SET FirstName = @firstName,
           LastName  = @lastName,
           Patronymic = @patronymic,
           Phone = @phone
     WHERE UserID = @userId;`,
    {
      userId: q.int(userId),
      firstName: q.text(firstName, 50),
      lastName: q.text(lastName, 50),
      patronymic: q.text(patronymic, 50),
      phone: q.text(phone, 30),
    },
  );
  return findUserById(userId);
}
