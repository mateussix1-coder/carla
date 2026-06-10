import { getSql } from './db.js'

function mapPost(post) {
  return {
    id: post.id,
    classId: post.class_id || '',
    authorId: post.author_id,
    author: post.author,
    className: post.class_name || '',
    avatarPath: post.avatar_path || '',
    date: post.created_at,
    activity: post.activity,
    related: post.related,
    text: post.text,
    image: post.image_path || '',
    likes: post.likes || [],
    comments: post.comments || [],
    likedByMe: Boolean(post.liked_by_me),
  }
}

const postSelection = (sql, userId, scope) => {
  if (scope.classId) {
    return sql`
      SELECT
        p.id, p.class_id, p.activity, p.related, p.body AS text, p.image_path,
        p.created_at, u.id AS author_id, u.name AS author, u.class_name,
        u.avatar_path,
        COALESCE((
          SELECT json_agg(json_build_object('id', lu.id, 'name', lu.name) ORDER BY pl.created_at)
          FROM post_likes pl
          JOIN users lu ON lu.id = pl.user_id
          WHERE pl.post_id = p.id
        ), '[]'::json) AS likes,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', pc.id, 'authorId', cu.id, 'author', cu.name,
            'text', pc.body, 'date', pc.created_at
          ) ORDER BY pc.created_at)
          FROM post_comments pc
          JOIN users cu ON cu.id = pc.author_id
          WHERE pc.post_id = p.id AND pc.deleted_at IS NULL
        ), '[]'::json) AS comments,
        EXISTS (
          SELECT 1 FROM post_likes own_like
          WHERE own_like.post_id = p.id AND own_like.user_id = ${userId}
        ) AS liked_by_me
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.deleted_at IS NULL AND p.class_id = ${scope.classId}
      ORDER BY p.created_at DESC
      LIMIT 100
    `
  }

  if (scope.role === 'student') {
    return sql`
      SELECT
        p.id, p.class_id, p.activity, p.related, p.body AS text, p.image_path,
        p.created_at, u.id AS author_id, u.name AS author, u.class_name,
        u.avatar_path,
        COALESCE((
          SELECT json_agg(json_build_object('id', lu.id, 'name', lu.name) ORDER BY pl.created_at)
          FROM post_likes pl
          JOIN users lu ON lu.id = pl.user_id
          WHERE pl.post_id = p.id
        ), '[]'::json) AS likes,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', pc.id, 'authorId', cu.id, 'author', cu.name,
            'text', pc.body, 'date', pc.created_at
          ) ORDER BY pc.created_at)
          FROM post_comments pc
          JOIN users cu ON cu.id = pc.author_id
          WHERE pc.post_id = p.id AND pc.deleted_at IS NULL
        ), '[]'::json) AS comments,
        EXISTS (
          SELECT 1 FROM post_likes own_like
          WHERE own_like.post_id = p.id AND own_like.user_id = ${userId}
        ) AS liked_by_me
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE
        p.deleted_at IS NULL
        AND (
          p.class_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM class_memberships cm
            WHERE
              cm.class_id = p.class_id
              AND cm.user_id = ${userId}
              AND cm.status = 'active'
          )
        )
      ORDER BY p.created_at DESC
      LIMIT 100
    `
  }

  return sql`
    SELECT
      p.id, p.class_id, p.activity, p.related, p.body AS text, p.image_path,
      p.created_at, u.id AS author_id, u.name AS author, u.class_name,
      u.avatar_path,
      COALESCE((
        SELECT json_agg(json_build_object('id', lu.id, 'name', lu.name) ORDER BY pl.created_at)
        FROM post_likes pl
        JOIN users lu ON lu.id = pl.user_id
        WHERE pl.post_id = p.id
      ), '[]'::json) AS likes,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', pc.id, 'authorId', cu.id, 'author', cu.name,
          'text', pc.body, 'date', pc.created_at
        ) ORDER BY pc.created_at)
        FROM post_comments pc
        JOIN users cu ON cu.id = pc.author_id
        WHERE pc.post_id = p.id AND pc.deleted_at IS NULL
      ), '[]'::json) AS comments,
      EXISTS (
        SELECT 1 FROM post_likes own_like
        WHERE own_like.post_id = p.id AND own_like.user_id = ${userId}
      ) AS liked_by_me
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT 100
  `
}

export async function listFeed(userId, scope = {}) {
  const sql = getSql()
  const rows = await postSelection(sql, userId, scope)
  return rows.map(mapPost)
}
