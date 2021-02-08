# Standard library
import json
import os
from os import path
import sys

# Third-party
import astropy.coordinates as coord
import astropy.table as at
from astropy.io import fits, ascii
import astropy.units as u
import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np

import gala.coordinates as gc
import gala.dynamics as gd

gc_frame = coord.Galactocentric(galcen_distance=8*u.kpc, z_sun=0*u.pc)

mw_disk_color = '0x5778a4'
cmap = plt.get_cmap('Set2')
cycler = plt.cycler("color", cmap.colors)()


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

    return {'color': mpl.colors.rgb2hex(next(cycler)['color']),
            'data': xyz}


def orp():
    data = np.loadtxt('../data/gaia_orphan_rrl.txt')
    c = coord.SkyCoord(ra=data[:, 0]*u.deg,
                       dec=data[:, 1]*u.deg,
                       distance=data[:, 2]*u.kpc)
    galcen = c.transform_to(gc_frame)
    xyz = galcen.data.xyz.T.value.tolist()

    return {'color': mpl.colors.rgb2hex(next(cycler)['color']),
            'data': xyz, 'opacity': 1., 'size': 0.5}


def pal5():
    xyz = np.loadtxt('../data/pal5.txt')
    return {'color': mpl.colors.rgb2hex(next(cycler)['color']),
            'data': xyz.tolist(),
            'opacity': 0.8}


def oph():
    data = ascii.read('../data/sesar.txt', format='commented_header',
                      header_start=2)
    c = coord.SkyCoord(ra=data['ra']*u.deg,
                       dec=data['dec']*u.deg,
                       distance=coord.Distance(distmod=data['DM']))
    galcen = c.transform_to(gc_frame)
    xyz = galcen.data.xyz.T.value.tolist()

    return {'color': mpl.colors.rgb2hex(next(cycler)['color']),
            'data': xyz, 'opacity': 0.8}


def shipp_streams():
    members = ascii.read('../data/shipp2019.txt', format='commented_header',
                         delimiter=',')
    dist_tbl = ascii.read('../data/shipp2019_tbl4.txt', format='basic',
                          delimiter='\t')

    joined = at.join(members, dist_tbl)

    streams = {}
    for name in np.unique(joined['Name']):
        rows = joined[joined['Name'] == name]
        c = coord.SkyCoord(ra=rows['RA']*u.deg,
                           dec=rows['Dec']*u.deg,
                           distance=coord.Distance(distmod=rows['m - M']))
        galcen = c.transform_to(gc_frame)
        xyz = galcen.data.xyz.T.value.tolist()

        streams[name] = {'color': mpl.colors.rgb2hex(next(cycler)['color']),
                         'data': xyz, 'opacity': 0.8}

    return streams


def sgr():
    # From Vasiliev: https://zenodo.org/record/4038137#.YCF4LRNKjUJ
    data = ascii.read('../data/Sgr_catalogue.txt', format='commented_header')
    c = coord.SkyCoord(ra=data['ra']*u.deg,
                       dec=data['dec']*u.deg,
                       distance=data['dist']*u.kpc)
    galcen = c.transform_to(gc_frame)
    xyz = galcen.data.xyz.T.value.tolist()

    return {'color': mpl.colors.rgb2hex(next(cycler)['color']),
            'data': xyz, 'opacity': 0.4, 'size': 0.2}


def main():
    data = {}

    data['Disk'] = mw()
    data['GD-1'] = gd1()
    data['Orphan'] = orp()
    data['Pal 5'] = pal5()
    data['Ophiuchus'] = oph()
    data['Sagittarius'] = sgr()
    data.update(shipp_streams())

    for k in data:
        if data[k]['color'].startswith('#'):
            data[k]['color'] = '0x' + data[k]['color'][1:]

    with open("../data.json", 'w') as f:
        f.write(json.dumps(data))


if __name__ == '__main__':
    basename = path.basename(os.getcwd())
    if basename != 'scripts':
        print('Must run in scripts directory')
        sys.exit(1)

    main()
