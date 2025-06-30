-- Add foreign key constraints after tables are created

ALTER TABLE posts 
DROP CONSTRAINT IF EXISTS fk_posts_user_id;

ALTER TABLE posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS fk_comments_post_id;

ALTER TABLE comments 
ADD CONSTRAINT fk_comments_post_id 
FOREIGN KEY (post_id) REFERENCES posts(id);