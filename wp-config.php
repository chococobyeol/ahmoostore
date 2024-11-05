<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', "ahmoos" );

/** Database username */
define( 'DB_USER', "ahmoos" );

/** Database password */
define( 'DB_PASSWORD', "FSCZWrkqc4KYw93" );

/** Database hostname */
define( 'DB_HOST', "localhost" );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb3' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          'C9xg^/]v6n5pmW9iV HI()a?zzmvq/zVeevvac>LpKk46E**^JmD)Y7w1)O8Q= q' );
define( 'SECURE_AUTH_KEY',   'T#>1{S)QDV+NZdLTI@Nn[>kx&46%>NsU[f#vk)&LV416z|<xFvrJ<TACZj[rYZbT' );
define( 'LOGGED_IN_KEY',     ';,gagG5In% L&]Ngvt&dKIT0X!P6Ne#h>7V+M}X5|sHLEm=(Xe%Y{HA#Jbf0Azy{' );
define( 'NONCE_KEY',         'N^ ozE~ 8PWB_VK@]7XAK--}(blWZHs%K}_zo|]GD`VmCT>[=s$~Z>+k?H*HAe`W' );
define( 'AUTH_SALT',         'O*E[hNdD*aH[+k,?.x2-}P__RJJ&oPt>pL!cC?2{BdOjg%2@d1Kv4@|ll8tC9l1T' );
define( 'SECURE_AUTH_SALT',  ', SN3vi[S<%}6B*2U|@[#e[_:uI6o&i;SS$(2&f5K3[/y#bpH6wCqYZ]S_ys}!Dk' );
define( 'LOGGED_IN_SALT',    'SsjVp,r@zuhwEr<qq8n.98cpUL[4v4Lf:LL)D~82dYH]-Hy+`YprW<6rPc5#j9%u' );
define( 'NONCE_SALT',        '{bm$[4Y#lNQ}:l371(JLD7aOh=]>E}2;.l|yRj+Z*wDb8=zNwpK1GiTbCZnajkzi' );
define( 'WP_CACHE_KEY_SALT', 'PlqeutLi~g(a}C*z0Q#`){^&}R}2?tx+Fv8lrXI! ^#)?TN,~r0n21DX?Tn1)Bv~' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', false );
}

define( 'WP_ENVIRONMENT_TYPE', 'local' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname(__FILE__) . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';

// 디버깅 설정만 남기고 CORS 관련 설정은 제거
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// 에러 로깅 활성화
@ini_set('log_errors', 'On');
@ini_set('error_log', ABSPATH . 'wp-content/debug.log');
