-- Fix foreign key relationships for proper joins
ALTER TABLE user_follows 
ADD CONSTRAINT user_follows_follower_id_fkey 
FOREIGN KEY (follower_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE user_follows 
ADD CONSTRAINT user_follows_following_id_fkey 
FOREIGN KEY (following_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE post_comments 
ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE user_posts 
ADD CONSTRAINT user_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE post_likes 
ADD CONSTRAINT post_likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;