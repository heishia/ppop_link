# Database Migrations

## 留덉씠洹몃젅?댁뀡 ?ㅽ뻾 諛⑸쾿

### Railway PostgreSQL?먯꽌 ?ㅽ뻾

1. Railway Dashboard ?묒냽
2. PostgreSQL ?쒕퉬???좏깮
3. **Connect** ??뿉???곌껐 ?뺣낫 ?뺤씤
4. psql ?먮뒗 Database ?대씪?댁뼵?몃줈 ?곌껐
5. 留덉씠洹몃젅?댁뀡 ?뚯씪 ?댁슜??蹂듭궗?섏뿬 ?ㅽ뻾

```bash
# psql濡??곌껐
psql $DATABASE_URL

# ?먮뒗 ?뚯씪濡??ㅽ뻾
psql $DATABASE_URL -f database/migrations/001_add_public_link_id.sql
```

### ?ㅽ뻾 ?쒖꽌

留덉씠洹몃젅?댁뀡? 踰덊샇 ?쒖꽌?濡??ㅽ뻾?댁빞 ?⑸땲??

1. `001_add_public_link_id.sql`
2. `002_add_button_style.sql`
3. `003_ppop_auth_migration.sql`
4. `004_update_plan_types.sql`
5. `005_add_phone_number.sql`
6. `006_create_content_table.sql`
7. `007_add_content_images_table.sql`
8. `008_remove_is_admin_column.sql`
9. `009_make_password_hash_nullable.sql`
10. `010_create_ip_blacklist.sql`
11. `011_remove_password_hash.sql`

## 二쇱쓽?ы빆

**?꾨줈?뺤뀡 ?섍꼍?먯꽌 留덉씠洹몃젅?댁뀡 ?ㅽ뻾 ??**

1. ?곗씠?곕쿋?댁뒪 諛깆뾽
2. 留덉씠洹몃젅?댁뀡 ?ㅽ겕由쏀듃 寃??3. 媛쒕컻 ?섍꼍?먯꽌 癒쇱? ?뚯뒪??4. ?몃옒?쎌씠 ?곸? ?쒓컙????ㅽ뻾
