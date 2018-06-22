# Standard library
import json
import os
from os import path
import sys

# Third-party
import astropy.coordinates as coord
from astropy.table import Table, vstack
from astropy.io import fits
import astropy.units as u
import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np

import gala.coordinates as gc
import gala.dynamics as gd

gc_frame = coord.Galactocentric(galcen_distance=8*u.kpc, z_sun=0*u.pc)

mw_disk_color = '0x5778a4'
mw_bulge_color = '0xe49343'
gd1_color = '0x85b5b2'
orp_color = '0xa985b5'
pal5_color = '0xccc857'

def mw_old():
    ndisk = 100000
    bulge_to_disk = 1 / 6
    nbulge = int(ndisk * bulge_to_disk)

    R = np.random.exponential(scale=3, size=ndisk)
    z = np.random.exponential(scale=0.25, size=ndisk)
    phi = np.random.uniform(0, 2*np.pi, size=ndisk)
    x = R * np.cos(phi)
    y = R * np.sin(phi)
    z = np.random.choice([-1, 1], size=ndisk) * z
    xyz_d = np.vstack((x, y, z)).T

    # bulge
    r = np.random.pareto(a=2.5, size=2*nbulge)
    r = r[r < 5][:nbulge]
    phi = np.random.uniform(0, 2*np.pi, size=nbulge)
    theta = np.arccos(2 * np.random.uniform(size=nbulge) - 1)
    x = r * np.cos(phi) * np.sin(theta)
    y = r * np.sin(phi) * np.sin(theta)
    z = r * np.cos(theta)
    xyz_b = np.vstack((x, y, z)).T

    # fig, axes = plt.subplots(1, 2, figsize=(10, 5), sharex=True, sharey=True)
    # axes[0].plot(x, y, marker='.', ls='none', alpha=0.2)
    # axes[1].plot(x, z, marker='.', ls='none', alpha=0.2)
    # axes[0].set_xlim(-10, 10)
    # axes[0].set_ylim(-10, 10)
    # fig.tight_layout()
    # plt.show()

    return [{'color': mw_disk_color, 'data': xyz_d.tolist()},
            {'color': mw_bulge_color, 'data': xyz_b.tolist()}]


def mw():
    xyz = np.loadtxt('../data/galaxy.txt')
    return {'color': mw_disk_color, 'data': xyz.tolist()}


def gd1():
    xyz = np.loadtxt('../data/gd1-high-prob.txt').tolist()
    # c = coord.SkyCoord(ra=data[:, 0]*u.deg,
    #                    dec=data[:, 1]*u.deg,
    #                    distance=data[:, 2]*u.kpc)
    # galcen = c.transform_to(gc_frame)
    # xyz = galcen.data.xyz.T.value.tolist()

    return {'color': gd1_color, 'data': xyz}


def orp():
    data = np.loadtxt('../data/orphan_rrl.txt')
    c = coord.SkyCoord(ra=data[:, 0]*u.deg,
                       dec=data[:, 1]*u.deg,
                       distance=data[:, 2]*u.kpc)
    galcen = c.transform_to(gc_frame)
    xyz = galcen.data.xyz.T.value.tolist()

    return {'color': orp_color, 'data': xyz, 'opacity': 1., 'size': 0.5}


def pal5():
    xyz = np.loadtxt('../data/pal5.txt')

    galcen = coord.Galactocentric(x=xyz[:, 0]*u.kpc,
                                  y=xyz[:, 1]*u.kpc,
                                  z=xyz[:, 2]*u.kpc)
    pal5 = galcen.transform_to(gc.Pal5)
    phi1 = pal5.phi1.wrap_at(180*u.deg)
    mask = (phi1 > -7*u.deg) & (phi1 < 15*u.deg)

    # fig, ax = plt.subplots(1, 1)
    # ax.scatter(pal5.phi1.wrap_at(180*u.deg)[mask],
    #            pal5.phi2[mask])
    # plt.show()

    return {'color': pal5_color, 'data': xyz[mask].tolist(),
            'opacity': 0.8}


def main():
    data = {}

    # mw_out = mw()
    # data['Disk'] = mw_out[0]
    # data['Bulge'] = mw_out[1]
    data['Disk'] = mw()
    data['GD-1'] = gd1()
    data['Orphan'] = orp()
    data['Pal 5'] = pal5()

    with open("../data.json", 'w') as f:
        f.write(json.dumps(data))


if __name__ == '__main__':
    basename = path.basename(os.getcwd())
    if basename != 'scripts':
        print('Must run in scripts directory')
        sys.exit(1)

    main()
